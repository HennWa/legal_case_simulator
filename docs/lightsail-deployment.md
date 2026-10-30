# Deploy Casendra from Windows PowerShell

This workflow updates the backend on the existing Ubuntu Lightsail instance. The
frontend continues deploying through Vercel. A backend update briefly interrupts
API requests while Docker Compose replaces the single container.

## Existing setup

- Server: `ubuntu@51.102.150.90`, static IPv4; SSH key
  `$env:USERPROFILE\.ssh\casendra-lightsail.pem`.
- `/home/ubuntu/casendra/compose.yaml` defines service `backend`, using
  `runtime.env` and host binding `127.0.0.1:8000:8000`.
- Existing Caddy service forwards `api.casendra.legal` to port 8000.
- AWS CLI profile `casendra` uses account `389049475070`; ECR repository
  `casendra-backend` is in `eu-central-1`.
- Windows Docker Desktop is running Linux containers. Git, Windows `tar`, AWS CLI
  and Windows OpenSSH are available. The existing Amazon ECR credential helper
  is configured for `389049475070.dkr.ecr.eu-central-1.amazonaws.com`.
- The server has Docker Compose, curl, python3 and flock (included in Ubuntu's
  util-linux package). The existing Compose file uses `env_file.format: raw`,
  which requires Compose 2.30 or later.
- SSH from this laptop works without a password prompt. Connect manually first
  to verify and accept the server host key. Do not disable host-key checking.

No AWS access keys are installed on the server. The laptop gets a temporary ECR
password; the server uses it with a private temporary Docker configuration that
is removed after pulling. Never paste tokens or runtime.env into logs or Git.

## First use

Merge these scripts into `master`, then open a **local Windows PowerShell
terminal** in the repository root (not the SSH shell or Python console):

```powershell
git switch master
git pull --ff-only origin master
aws sts get-caller-identity --profile casendra
docker info
.\scripts\deploy-backend.ps1
```

If Windows blocks the locally reviewed script under execution policy, run this
for the current PowerShell process and retry (organization Group Policy may
still apply):

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy RemoteSigned
.\scripts\deploy-backend.ps1
```

Renew your AWS CLI login using your existing login method if expired. If SSH
times out, check that Lightsail's port 22 rule allows your current laptop public
IPv4. Ports 80/443 remain open for Caddy; port 8000 stays private.

## Every backend update

Test changes on `development`, merge them into `master`, push to GitHub, then:

```powershell
git switch master
git pull --ff-only origin master
.\scripts\deploy-backend.ps1
```

The script checks for a clean, up-to-date `master`, exports only committed Git
files to a temporary build directory, builds for `linux/amd64`, pushes a unique
commit/time tag and resolves its ECR digest. It pulls that exact digest on the
server before changing the running container. Your Dockerfile's dependency
cache still applies to local builds.

The server writes a managed `compose.override.yaml` containing only the chosen
backend image and `pull_policy: never`. Docker Compose automatically loads this
override during normal `docker compose up -d` commands. Your base compose file,
environment file, ports, volumes and Caddy configuration are preserved. The
helper refuses to replace an unrelated existing override.

If container replacement fails or local `/health` does not return status `ok`,
environment `production` and auth mode `auth0`, the helper attempts to restore
the previous image. It checks that the response comes while the expected image
is running. Local checks retry 30 times, two seconds apart, with a three-second
HTTP timeout per attempt. It prints whether rollback succeeded and returns an
error for the failed deployment.

A final check from the laptop tests public HTTPS. Failure of this check does
not roll back a locally healthy backend; investigate DNS/Caddy/connectivity.

## Roll back a completed deployment

```powershell
.\scripts\deploy-backend.ps1 -Rollback
```

This uses the previous image retained on Lightsail and requires neither an AWS
login nor a build/push. It is available after the first successful image-changing
deployment. A successful rollback records the image it replaced, so invoking it
again switches back. Do not prune retained rollback images until you no longer
need them. An unhealthy starting backend fails preflight; inspect and recover
it manually rather than repeatedly running the deployment script.

Image rollback does **not** undo database changes or schema migrations. The
existing `/health` route reports application settings; it does not continuously
test MongoDB, Auth0 or OpenAI. Run the app's functional checks after a release.
This is a single-instance workflow, not zero-downtime deployment. A lost SSH
connection can leave the outcome uncertain; inspect the server before retrying.

## Inspect the server

```powershell
ssh -i "$env:USERPROFILE\.ssh\casendra-lightsail.pem" ubuntu@51.102.150.90
```

Then on Ubuntu:

```bash
cd /home/ubuntu/casendra
docker compose ps
docker compose logs --tail=100 backend
curl --fail http://127.0.0.1:8000/health
cat compose.override.yaml
```

Do not print `runtime.env` or the output of plain `docker compose config`; both
can expose credentials. `docker compose config --quiet` validates silently.
Runtime settings are not synchronized by deployment. If you intentionally edit
`runtime.env`, apply them using `docker compose up -d --force-recreate backend`.

Alternate connection parameters:

```powershell
.\scripts\deploy-backend.ps1 -ServerIp '51.102.150.90' -SshKey "$env:USERPROFILE\.ssh\casendra-lightsail.pem" -AwsProfile 'casendra'
```

## Validation status

The server helper has syntax and mocked lifecycle checks (success, failed update
with rollback, failed rollback, manual rollback and unrelated override refusal).
Run them on Linux with `python3 -m unittest discover -s scripts/tests -v`.
The scripts have not been executed against your Windows laptop, AWS account or
live server. Complete the first deployment with the output visible and check
the online app afterwards.
