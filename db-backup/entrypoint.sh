#!/bin/sh
set -e

echo "${SCHEDULE:-0 6 * * *} /backup.sh >> /proc/1/fd/1 2>&1" > /etc/crontabs/root

exec crond -f -l 8
