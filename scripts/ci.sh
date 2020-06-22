#!/bin/bash -e

source $(dirname "$0")/logger.sh

nvm install 14

if [ ! -z ${REACT_NATIVE_VERSION} ]; then
  node scripts/change_react_native_version.js "detox/test" ${REACT_NATIVE_VERSION}
fi

run_f "lerna bootstrap"

run_f "lerna run build"
run_f "lerna run test"
