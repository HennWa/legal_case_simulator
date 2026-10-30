[CmdletBinding()]
param(
    [string]$ServerIp = '51.102.150.90',
    [string]$SshKey = "$env:USERPROFILE\.ssh\casendra-lightsail.pem",
    [string]$AwsProfile = 'casendra',
    [switch]$Rollback
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$region = 'eu-central-1'
$accountId = '389049475070'
$registry = "$accountId.dkr.ecr.$region.amazonaws.com"
$repository = "$registry/casendra-backend"
$remoteDir = '/home/ubuntu/casendra'
$repoRoot = Split-Path -Parent $PSScriptRoot
$sshExe = "$env:WINDIR\System32\OpenSSH\ssh.exe"
$scpExe = "$env:WINDIR\System32\OpenSSH\scp.exe"

function Assert-Exit([string]$Operation) {
    if ($LASTEXITCODE -ne 0) {
        throw "$Operation failed (exit code $LASTEXITCODE)."
    }
}

# Restrict remotely interpolated arguments to their intended forms.
if ($ServerIp -notmatch '^\d{1,3}(\.\d{1,3}){3}$') {
    throw 'ServerIp must be an IPv4 address.'
}
if (!(Test-Path -LiteralPath $SshKey -PathType Leaf)) {
    throw "SSH key not found: $SshKey"
}
foreach ($tool in @($sshExe, $scpExe)) {
    if (!(Test-Path -LiteralPath $tool -PathType Leaf)) {
        throw "Required Windows OpenSSH executable not found: $tool"
    }
}
$helperPath = Join-Path $PSScriptRoot 'deploy-backend-server.sh'
if (!(Test-Path -LiteralPath $helperPath -PathType Leaf)) {
    throw "Server helper not found: $helperPath"
}
$destination = "ubuntu@$ServerIp"
$sshOptions = @('-T', '-o', 'BatchMode=yes', '-o', 'ConnectTimeout=15',
    '-o', 'ServerAliveInterval=15', '-o', 'ServerAliveCountMax=3', '-i', $SshKey)
$oldAwsProfile = $env:AWS_PROFILE
$workDir = Join-Path ([IO.Path]::GetTempPath()) ('casendra-deploy-' + [guid]::NewGuid().ToString('N'))

Push-Location $repoRoot
try {
    New-Item -ItemType Directory -Path $workDir | Out-Null
    # Normalize line endings even when Git on Windows checks shell files out as CRLF.
    $helperText = [IO.File]::ReadAllText($helperPath).Replace("`r`n", "`n")
    $normalizedHelper = Join-Path $workDir 'deploy-backend-server.sh'
    [IO.File]::WriteAllText($normalizedHelper, $helperText, (New-Object Text.UTF8Encoding($false)))
    $remoteHelper = "$remoteDir/.deploy-$([guid]::NewGuid().ToString('N')).sh"

    if (!$Rollback) {
        foreach ($tool in @('git', 'docker', 'aws', 'tar')) {
            Get-Command $tool -ErrorAction Stop | Out-Null
        }
        $branch = & git branch --show-current
        Assert-Exit 'Reading Git branch'
        if ($branch -ne 'master') { throw 'Switch to master before deploying.' }
        $changes = @(& git status --porcelain)
        Assert-Exit 'Checking working tree'
        if ($changes.Count -gt 0) { throw 'Commit or stash changes and untracked files before deploying.' }
        & git fetch origin master
        Assert-Exit 'Fetching origin/master'
        $commit = & git rev-parse HEAD
        Assert-Exit 'Reading commit'
        $remoteCommit = & git rev-parse FETCH_HEAD
        Assert-Exit 'Reading fetched master'
        if ($commit -ne $remoteCommit) {
            throw 'Local master differs from origin/master. Run git pull --ff-only or push your reviewed commits first.'
        }
        & docker info --format '{{.OSType}}'
        Assert-Exit 'Connecting to Docker'
        $env:AWS_PROFILE = $AwsProfile
        $identity = & aws sts get-caller-identity --profile $AwsProfile --query Account --output text
        Assert-Exit 'Checking AWS credentials (renew your AWS login if expired)'
        if ($identity -ne $accountId) { throw "AWS profile must use account $accountId." }
    }

    # Use matching Windows scp/ssh binaries; do not put credentials in arguments.
    & $scpExe -S $sshExe -o BatchMode=yes -o ConnectTimeout=15 -i $SshKey $normalizedHelper "${destination}:$remoteHelper"
    Assert-Exit 'Copying deployment helper'
    try {
        & $sshExe @sshOptions $destination "bash '$remoteHelper' check"
        Assert-Exit 'Server preflight'

        if ($Rollback) {
            & $sshExe @sshOptions $destination "bash '$remoteHelper' rollback"
            Assert-Exit 'Rollback'
        } else {
            $tag = 'git-' + $commit.Substring(0, 12) + '-' + [DateTime]::UtcNow.ToString('yyyyMMddHHmmss')
            $taggedImage = "${repository}:$tag"
            $archive = Join-Path $workDir 'source.tar'
            $context = Join-Path $workDir 'source'
            New-Item -ItemType Directory -Path $context | Out-Null
            # Build only tracked files from this exact commit, never the local venv or .env.
            & git archive --format=tar --output $archive $commit
            Assert-Exit 'Exporting committed source'
            & tar -xf $archive -C $context
            Assert-Exit 'Extracting build context'
            & docker build --platform linux/amd64 --label "org.opencontainers.image.revision=$commit" -t $taggedImage $context
            Assert-Exit 'Building backend image'
            # The installed ECR credential helper reads AWS_PROFILE for the local push.
            & docker push $taggedImage
            Assert-Exit 'Pushing image (check your ECR credential helper if authentication fails)'
            $digest = & aws ecr describe-images --profile $AwsProfile --region $region --repository-name casendra-backend --image-ids "imageTag=$tag" --query 'imageDetails[0].imageDigest' --output text
            Assert-Exit 'Resolving ECR digest'
            if ($digest -notmatch '^sha256:[a-f0-9]{64}$') { throw 'ECR did not return a valid image digest.' }
            $image = "$repository@$digest"

            $password = & aws ecr get-login-password --region $region --profile $AwsProfile
            Assert-Exit 'Getting temporary ECR password'
            if ([string]::IsNullOrWhiteSpace($password)) { throw 'AWS returned an empty ECR password.' }
            # Private temporary Docker config on the server, removed on exit.
            $pullCommand = 'set -eu; umask 077; cfg=$(mktemp -d); trap ''rm -rf "$cfg"'' EXIT; '
            $pullCommand += 'docker --config "$cfg" login --username AWS --password-stdin ' + $registry
            $pullCommand += ' && docker --config "$cfg" pull ' + $image
            try {
                $password | & $sshExe @sshOptions $destination $pullCommand
                Assert-Exit 'Pulling image on Lightsail'
            } finally { $password = $null }

            Write-Host "Deploying commit $commit ($tag)"
            Write-Host "Image: $image"
            & $sshExe @sshOptions $destination "bash '$remoteHelper' deploy '$image'"
            Assert-Exit 'Deploying backend (read server output for rollback status)'
        }

        # This tests DNS, TLS and Caddy after the server's local health check.
        # A failure here does not automatically roll back a locally healthy backend.
        try {
            $publicHealth = Invoke-RestMethod -Uri 'https://api.casendra.legal/health' -TimeoutSec 20
            if ($publicHealth.status -ne 'ok' -or $publicHealth.environment -ne 'production' -or $publicHealth.auth_mode -ne 'auth0') {
                throw 'Unexpected public health response.'
            }
            Write-Host 'Success: https://api.casendra.legal/health is healthy.'
        } catch {
            throw "Server update finished, but the public HTTPS check failed. Check DNS/Caddy before retrying deployment. $($_.Exception.Message)"
        }
    } finally {
        & $sshExe @sshOptions $destination "rm -f '$remoteHelper'"
        if ($LASTEXITCODE -ne 0) { Write-Warning "Could not remove temporary server helper: $remoteHelper" }
    }
} finally {
    $env:AWS_PROFILE = $oldAwsProfile
    Pop-Location
    if (Test-Path -LiteralPath $workDir) { Remove-Item -LiteralPath $workDir -Recurse -Force }
}
