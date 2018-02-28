#!/bin/bash -e

source $(dirname "$0")/travis_logger.sh

echo "Changing react-native dependency in test project to $REACT_NATIVE_VERSION"
node scripts/change_react_native_version.js "$REACT_NATIVE_VERSION"

run_f "$(dirname "$0")/bootstrap.sh"

run_f "lerna run --ignore detox-demo* build"
run_f "lerna run --ignore detox-demo* test"
