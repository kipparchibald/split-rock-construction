#!/bin/sh
set -eu
cd /workspace
if curl -sf -o /dev/null --max-time 2 http://127.0.0.1:8080/; then
  exit 0
fi
npm run dev >>/tmp/app-startup.log 2>&1 &
# wait for ready
i=0
while [ $i -lt 60 ]; do
  if curl -sf -o /dev/null --max-time 2 http://127.0.0.1:8080/; then
    exit 0
  fi
  i=$((i+1))
  sleep 1
done
echo "dev server failed to start" >&2
tail -50 /tmp/app-startup.log >&2 || true
exit 1
