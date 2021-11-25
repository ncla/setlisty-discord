#!/bin/sh
set -e

if [ "${1}" = "run_worker" ]; then
  node dist/schedule.js
elif [ "${1}" = "run_bot" ]; then
  node dist/index.js
elif [ "${1}" = "migrate" ]; then
  yarn run migrate
elif [ "${1}" = "register" ]; then
  node dist/deploy_commands.js
elif [ "${1}" = "test" ]; then
  yarn run test
else
  echo expected run_worker, run_bot, migrate or register, got "${1}" instead
fi