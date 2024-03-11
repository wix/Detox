#!/usr/bin/env bash

source $(dirname "$0")/logger.sh
source $(dirname "$0")/install.sh

if [ -z "$REACT_NATIVE_VERSION" ]; then
  echo "Error: REACT_NATIVE_VERSION variable was not defined!"
  exit 1
fi

if [ "$REACT_NATIVE_COMPAT_TEST" != "true" ]; then
  node scripts/change_react_native_version.js "detox" ${REACT_NATIVE_VERSION} "devDependencies"
fi

# Update the dependencies of the test project because bootstrap will run and fail
node scripts/change_react_native_version.js "detox/test" ${REACT_NATIVE_VERSION} "dependencies"
# Only update the demo-react-native project; others will use this binary
node scripts/change_react_native_version.js "examples/demo-react-native" ${REACT_NATIVE_VERSION} "dependencies"

run_f "lerna bootstrap --no-ci"
