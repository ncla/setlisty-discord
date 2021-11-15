#!/bin/sh
set -e

if [ "${1}" = "run_worker" ]; then
  watch -n 1 node dist/execute_artist_job.js
elif [ "${1}" = "run_bot" ]; then
  node dist/index.js
elif [ "${1}" = "migrate" ]; then
  yarn run migrate
elif [ "${1}" = "register" ]; then
  yarn run register
else
  echo expected run_worker, run_bot, migrate or register, got "${1}" instead
fi