#!/bin/sh
set -e

if [ "${1}" = "run_worker" ]; then
  watch -n 1 node dist/execute_artist_job.js
elif [ "${1}" = "run_bot" ]; then
  node dist/index.js
elif [ "${1}" = "migrate" ]; then
  yarn run migrate
else
  echo expected run_worker, run_bot or migrate, got "${1}" instead
fi