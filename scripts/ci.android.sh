#!/bin/bash -ex

trap $(dirname "$0")/upload_artifact.sh EXIT

# Approve unapproved SDK licenses
yes | $ANDROID_HOME/cmdline-tools/latest/bin/sdkmanager --licenses

source $(dirname "$0")/ci.sh

pushd detox/test
run_f "npm run integration"
popd

currentRnVersion=$(echo "${REACT_NATIVE_VERSION}" | cut -d "." -f2);
if [[ $currentRnVersion -ge 66 ]]; then
  pushd detox/android
  run_f "./gradlew testFullRelease"
  popd
else
  echo "Skipping Android unit tests (react-native version ${currentRnVersion} is not ≥66)"
fi

mkdir -p coverage

run_f "scripts/ci.genycloud-login.sh"

pushd detox/test

run_f "npm run build:android"
cp ../coverage/lcov.info ../../coverage/unit.lcov

run_f "npm run e2e:android:genycloud"
cp coverage/lcov.info ../../coverage/e2e-genycloud-ci.lcov

run_f "npm run e2e:android -- e2e/01* e2e/02* e2e/03.actions*"
cp coverage/lcov.info ../../coverage/e2e-emulator-ci.lcov

run_f "scripts/ci_unhappy.sh android"

# run_f "npm run verify-artifacts:android"
popd
