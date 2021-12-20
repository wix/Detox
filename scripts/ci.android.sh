#!/bin/bash -ex

# Approve unapproved SDK licenses
yes | $ANDROID_HOME/cmdline-tools/latest/bin/sdkmanager --licenses

source $(dirname "$0")/ci.sh

pushd detox/test
run_f "npm run integration"
popd

currentRnVersion=$(echo "${REACT_NATIVE_VERSION}" | cut -d "." -f2);
if [[ -z ${SKIP_UNIT_TESTS} && $currentRnVersion -ge 66 ]]; then
  pushd detox/android
  run_f "./gradlew testFullRelease"
  popd
else
  echo "SKIP_UNIT_TESTS is set: Skipping Android unit tests"
fi

mkdir -p coverage

run_f "scripts/ci.genycloud-login.sh"

pushd detox/test

run_f "npm run build:android"
cp ../coverage/lcov.info ../../coverage/unit.lcov

run_f "npm run e2e:android-ci-genycloud"
cp coverage/lcov.info ../../coverage/e2e-android-ci.lcov

run_f "npm run e2e:android-ci-google -- e2e/01* e2e/02* e2e/03.actions*"

run_f "scripts/ci_unhappy.sh android"

# run_f "npm run verify-artifacts:android"
popd
