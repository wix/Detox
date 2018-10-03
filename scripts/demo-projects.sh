#!/usr/bin/env bash

source $(dirname "$0")/logger.sh

if [ ! -z ${REACT_NATIVE_VERSION} ]; then
  for proj in demo-react-native demo-react-native-jest; do
    node scripts/change_react_native_version.js "examples/${proj}" ${REACT_NATIVE_VERSION}
  done
fi

run_f "lerna bootstrap"
