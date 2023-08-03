#!/bin/bash -ex

UPLOAD_ARTIFACT="$(pwd)/scripts/upload_artifact.sh"
trap "$UPLOAD_ARTIFACT" EXIT

source $(dirname "$0")/ci.sh

mkdir -p coverage

pushd detox/test

# run_f "npm run build:ios"
run_f "npm run e2e:ios"

# run_f "npm run verify-artifacts:ios"
popd
