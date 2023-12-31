#!/bin/bash -ex

#Set xcode version from .xcoderc file
if [[ -f .xcoderc ]];then
    xc_version=$(cat .xcoderc)
    echo "Setting $xc_version"
    export DEVELOPER_DIR=$xc_version
else
    echo ".xcoderc not found. Xcode is default"
fi

UPLOAD_ARTIFACT="$(pwd)/scripts/upload_artifact.sh"
trap "$UPLOAD_ARTIFACT" EXIT

source $(dirname "$0")/ci.sh

mkdir -p coverage

pushd detox/test

run_f "npm run build:ios"
run_f "npm run e2e:ios"
cp coverage/lcov.info ../../coverage/e2e-ios-ci.lcov

run_f "scripts/ci_unhappy.sh ios"

# run_f "npm run verify-artifacts:ios"
popd
