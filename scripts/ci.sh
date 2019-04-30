#!/bin/bash -e

source $(dirname "$0")/logger.sh

if [ ! -z ${REACT_NATIVE_VERSION} ]; then
  node scripts/change_react_native_version.js "detox/test" ${REACT_NATIVE_VERSION}
fi

run_f "lerna bootstrap"

run_f "lerna run --ignore detox-demo* build"
run_f "lerna run --ignore detox-demo* test"
