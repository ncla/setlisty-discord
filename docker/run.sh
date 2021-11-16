#!/bin/sh
set -e

if [ "${1}" = "run_worker" ]; then
  while true; do
   node dist/execute_artist_job.js
   sleep 1
  done
elif [ "${1}" = "run_bot" ]; then
  node dist/index.js
elif [ "${1}" = "migrate" ]; then
  yarn run migrate
elif [ "${1}" = "register" ]; then
  node dist/deploy-commands.js
else
  echo expected run_worker, run_bot, migrate or register, got "${1}" instead
fi