#!/bin/sh
set -e

if [ "${APP_TYPE}" = "SCRAPER" ]; then
  watch -n 1 node execute_artist_job.js
elif [ "${APP_TYPE}" = "BOT" ]; then
  node index.js
else
  echo expected APP_TYPE env variable to be SCRAPER or BOT, but "${APP_TYPE}" found
fi