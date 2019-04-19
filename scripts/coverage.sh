#!/bin/bash -e

if [ ! -z ${COVERALLS_REPO_TOKEN} ];
then
  run_f "npm run coveralls"
else
  echo "Skipping code coverage upload."
fi
