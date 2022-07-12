#!/bin/bash -ex

trap $(dirname "$0")/upload_artifact.sh EXIT

source $(dirname "$0")/ci.sh 'noGenerate'

mkdir -p coverage

pushd detox/test

run_f "npm run build:ios"
cp ../coverage/lcov.info ../../coverage/unit.lcov

run_f "npm run e2e:ios"
cp coverage/lcov.info ../../coverage/e2e-ios-ci.lcov

run_f "scripts/ci_unhappy.sh ios"

# run_f "npm run verify-artifacts:ios"
popd
