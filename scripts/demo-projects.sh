#!/usr/bin/env bash

source $(dirname "$0")/logger.sh
source $(dirname "$0")/install.sh

# Only update the demo-react-native project; others will use this binary
node scripts/change_react_native_version.js "examples/demo-react-native" ${REACT_NATIVE_VERSION}

run_f "lerna bootstrap --no-ci"
