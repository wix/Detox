#!/bin/bash -e

source $(dirname "$0")/ci.sh

run_f "$(dirname "$0")/unit.ios.sh"

mkdir -p coverage

pushd detox/test

run_f "npm run build:ios"
cp ../coverage/lcov.info ../../coverage/unit.lcov

run_f "npm run e2e:ios-ci"
cp coverage/lcov.info ../../coverage/e2e-ios-ci.lcov

run_f "npm run e2e:ios-timeout-ci"
cp coverage/lcov.info ../../coverage/e2e-ios-timeout-ci.lcov

run_f "npm run e2e:legacy-jasmine:ios-timeout-ci"
cp coverage/lcov.info ../../coverage/e2e-legacy-jasmine-ios-timeout-ci.lcov

# run_f "npm run verify-artifacts:ios"
popd
