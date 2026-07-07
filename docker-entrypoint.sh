#!/bin/sh
# On Fly.io / Render / Railway the persistent volume is mounted OVER /data at
# runtime, owned by root — the image's build-time chown is shadowed. Fix the
# ownership here (as root), then drop to the unprivileged `app` user.
set -e

DATA_DIR="${DATA_DIR:-/data}"
mkdir -p "$DATA_DIR"
chown -R app:app "$DATA_DIR" 2>/dev/null || true

exec su-exec app "$@"
