#!/bin/bash -e

source $(dirname "$0")/travis_logger.sh

if [ ! -z ${REACT_NATIVE_VERSION} ]; then
  node scripts/change_react_native_version.js "detox/test" ${REACT_NATIVE_VERSION}
fi

run_f "$(dirname "$0")/bootstrap.sh"

run_f "lerna run --ignore detox-demo* build"
run_f "lerna run --ignore detox-demo* test"
