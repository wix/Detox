#!/bin/bash -ex

UPLOAD_ARTIFACT="$(pwd)/scripts/upload_artifact.sh"
trap "$UPLOAD_ARTIFACT" EXIT

# Approve unapproved SDK licenses
yes | $ANDROID_HOME/cmdline-tools/latest/bin/sdkmanager --licenses

currentRnVersion=$(echo "${REACT_NATIVE_VERSION}" | cut -d "." -f2);
if [[ $currentRnVersion -ge 68 ]]; then
  source $(dirname "$0")/ci.sh
else
  echo 'Warning: Setting "skip" over invoke-code auto-generation because the react-native is lower than 68 and therefore contains patches (see detox/test/postinstall.js)'
  source $(dirname "$0")/ci.sh 'noGenerate'
fi

pushd detox/test
run_f "npm run integration"
popd

pushd detox/android
run_f "npm run unit:android-release"
popd

NPM_ANDROID_FLAVOR="android"
if [[ $currentRnVersion -lt 71 ]]; then
  NPM_ANDROID_FLAVOR="android-rnLegacy"
fi
echo "Selected android flavor '${NPM_ANDROID_FLAVOR}' for npm-scripts (RN version is ${currentRnVersion})"

mkdir -p coverage

pushd detox/test

run_f "npm run build:${NPM_ANDROID_FLAVOR}"

run_f "npm run e2e:${NPM_ANDROID_FLAVOR}:genycloud"
cp coverage/lcov.info ../../coverage/e2e-genycloud-ci.lcov

run_f "npm run e2e:${NPM_ANDROID_FLAVOR} -- e2e/01* e2e/02* e2e/03.actions*"
cp coverage/lcov.info ../../coverage/e2e-emulator-ci.lcov

run_f "scripts/ci_unhappy.sh ${NPM_ANDROID_FLAVOR}"

# run_f "npm run verify-artifacts:${NPM_ANDROID_FLAVOR"
popd
