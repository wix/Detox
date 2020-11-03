#!/bin/bash -e

source $(dirname "$0")/logger.sh
source $(dirname "$0")/install.sh

if [ ! -z ${REACT_NATIVE_VERSION} ]; then
  node scripts/change_react_native_version.js "detox/test" ${REACT_NATIVE_VERSION}
fi

run_f "lerna bootstrap --no-ci"
run_f "lerna run build"
run_f "lerna run test"
