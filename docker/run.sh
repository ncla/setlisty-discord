#!/bin/sh
set -e

if [ "${1}" = "run_worker" ]; then
  TIME_SLEPT=0
  while true; do
   TIME_SLEPT=$(expr $TIME_SLEPT + 1)
   if [ "$TIME_SLEPT" -eq "5" ]; then
     node dist/jobs/update_events.js || echo "UPDATE_SETLISTS FAIL" && echo "UPDATE_SETLISTS SUCCESS"
     TIME_SLEPT=0
   else
     node dist/jobs/update_setlists.js || echo "UPDATE_EVENTS FAIL" && echo "UPDATE_EVENTS SUCCESS"
   fi
   sleep 1
  done
elif [ "${1}" = "run_bot" ]; then
  node dist/index.js
elif [ "${1}" = "migrate" ]; then
  yarn run migrate
elif [ "${1}" = "register" ]; then
  node dist/deploy_commands.js
else
  echo expected run_worker, run_bot, migrate or register, got "${1}" instead
fi