#!/usr/bin/env bash
# Invoked by deploy-backend.ps1 on the existing Ubuntu Lightsail server.
set -Eeuo pipefail
umask 077
cd /home/ubuntu/casendra
unset COMPOSE_FILE COMPOSE_PROJECT_NAME

action=${1:-}
case "$action" in check|deploy|rollback) ;; *) echo 'Expected check, deploy or rollback.' >&2; exit 2 ;; esac
for tool in docker curl python3 flock; do command -v "$tool" >/dev/null; done
exec 9>.deploy.lock
flock -n 9 || { echo 'Another deployment is running.' >&2; exit 1; }

marker='# Managed by scripts/deploy-backend.ps1'
override=compose.override.yaml
previous=.previous-backend-image
[[ -f compose.yaml && -f runtime.env ]] || { echo 'Missing compose.yaml or runtime.env.' >&2; exit 1; }
for alternative in compose.override.yml docker-compose.override.yaml docker-compose.override.yml; do
    [[ ! -e "$alternative" ]] || { echo "Review existing override first: $alternative" >&2; exit 1; }
done
if [[ -e "$override" ]] && [[ $(head -n 1 "$override") != "$marker" ]]; then
    echo 'Existing compose.override.yaml is not managed by this script; refusing to replace it.' >&2
    exit 1
fi

dc() {
    local args=(-f compose.yaml)
    [[ ! -f "$override" ]] || args+=(-f "$override")
    docker compose "${args[@]}" "$@"
}

health_once() {
    curl --fail --silent --show-error --max-time 3 http://127.0.0.1:8000/health |
        python3 -c 'import json,sys; d=json.load(sys.stdin); sys.exit(0 if d.get("status")=="ok" and d.get("environment")=="production" and d.get("auth_mode")=="auth0" else 1)'
}

dc config --quiet
container=$(dc ps -q backend)
[[ -n "$container" && "$container" != *$'\n'* ]] || { echo 'Expected one running backend container.' >&2; exit 1; }
current_id=$(docker inspect --format '{{.Image}}' "$container")
[[ "$current_id" =~ ^sha256:[a-f0-9]{64}$ ]] || exit 1
health_once >/dev/null
if [[ "$action" == check ]]; then
    echo 'Server preflight passed.'
    exit 0
fi

if [[ "$action" == rollback ]]; then
    [[ -f "$previous" ]] || { echo 'No previous successful deployment recorded yet.' >&2; exit 1; }
    target=$(cat "$previous")
    [[ "$target" =~ ^casendra-backend-rollback:[a-f0-9]{64}$ ]] || { echo 'Invalid rollback reference.' >&2; exit 1; }
else
    target=${2:-}
    [[ "$target" =~ ^389049475070\.dkr\.ecr\.eu-central-1\.amazonaws\.com/casendra-backend@sha256:[a-f0-9]{64}$ ]] || { echo 'Invalid deployment image.' >&2; exit 1; }
fi
target_id=$(docker image inspect --format '{{.Id}}' "$target")
if [[ "$target_id" == "$current_id" ]]; then
    echo 'Requested image is already running; no changes needed.'
    exit 0
fi

# A tag keeps the previous image available through ordinary dangling-image cleanup.
rollback_image="casendra-backend-rollback:${current_id#sha256:}"
docker image tag "$current_id" "$rollback_image"
switched=0
write_override() {
    local tmp
    tmp=$(mktemp ./compose.override.XXXXXX)
    printf '%s\nservices:\n  backend:\n    image: "%s"\n    pull_policy: never\n' "$marker" "$1" > "$tmp"
    mv -f "$tmp" "$override"
}

wait_healthy() {
    local expected=$1 cid actual running attempt
    for ((attempt=0; attempt<30; attempt++)); do
        cid=$(dc ps -q backend) || cid=''
        if [[ -n "$cid" ]]; then
            actual=$(docker inspect --format '{{.Image}}' "$cid") || actual=''
            running=$(docker inspect --format '{{.State.Running}}' "$cid") || running=''
            if [[ "$actual" == "$expected" && "$running" == true ]] && health_once >/dev/null 2>&1; then
                return 0
            fi
        fi
        sleep 2
    done
    return 1
}

finish() {
    local result=$?
    trap - EXIT INT TERM
    if ((result != 0 && switched == 1)); then
        set +e
        echo "Update failed. Restoring $rollback_image" >&2
        if write_override "$rollback_image" && dc up -d --no-deps --force-recreate backend && wait_healthy "$current_id"; then
            echo 'Previous backend restored and healthy.' >&2
        else
            echo 'ROLLBACK FAILED. Inspect: docker compose ps; docker compose logs --tail=100 backend' >&2
        fi
    fi
    exit "$result"
}
trap finish EXIT
trap 'exit 130' INT
trap 'exit 143' TERM

switched=1
write_override "$target"
dc config --quiet
dc up -d --no-deps --force-recreate backend
if ! wait_healthy "$target_id"; then
    echo 'New backend did not become healthy within the retry window.' >&2
    exit 1
fi
state_tmp=$(mktemp ./.previous-backend-image.XXXXXX)
printf '%s\n' "$rollback_image" > "$state_tmp"
mv -f "$state_tmp" "$previous"
switched=0
echo "Backend healthy: $target"
echo "Previous image retained: $rollback_image"
