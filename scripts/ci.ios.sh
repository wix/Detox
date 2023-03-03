#!/bin/bash -ex

UPLOAD_ARTIFACT="$(pwd)/scripts/upload_artifact.sh"
trap "$UPLOAD_ARTIFACT" EXIT

source $(dirname "$0")/ci.sh 'noGenerate'

mkdir -p coverage

pushd detox/test

run_f "npm run build:ios"
run_f "npm run e2e:ios"
cp coverage/lcov.info ../../coverage/e2e-ios-ci.lcov

run_f "scripts/ci_unhappy.sh ios"

# run_f "npm run verify-artifacts:ios"
popd
