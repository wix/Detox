#!/bin/bash -ex

UPLOAD_ARTIFACT="$(pwd)/scripts/upload_artifact.sh"
trap "$UPLOAD_ARTIFACT" EXIT

### Approve unapproved SDK licenses
yes | $ANDROID_HOME/cmdline-tools/latest/bin/sdkmanager --licenses

source $(dirname "$0")/ci.sh

### JS integration tests
pushd detox/test
run_f "yarn integration"
popd

### Android native unit tests
pushd detox/android
run_f "yarn unit:android-release"
popd

mkdir -p coverage

### E2E self-tests
pushd detox/test

run_f "yarn build:android-debug" # Workaround for asyncstorage issue https://github.com/react-native-async-storage/async-storage/issues/1216. Can be removed after fixing it
run_f "yarn build:android"

run_f "yarn e2e:android"
cp coverage/lcov.info ../../coverage/e2e-emulator-ci.lcov

if [ "$TEST_SINGLE_ADB_SERVER_SANITY" = "true" ]; then
  ### Custom backwards-compatible test for single ADB server
  killall adb
  run_f "yarn e2e:android.single-adb-server e2e/01* e2e/02*"
  cp coverage/lcov.info ../../coverage/e2e-emulator-single-adb-server-ci.lcov
  ADB_SERVER_COUNT=$(ps -ef | grep adb | grep -v "grep" | grep '' -c)
  if [ "$ADB_SERVER_COUNT" -gt 1 ]; then
    echo "[FAIL] ADB server count is greater than 1: $ADB_SERVER_COUNT"
    exit 1
  fi
fi

if [ "$TEST_GENYCLOUD_SANITY" = "true" ]; then
  # Sanity-test support for genycloud (though not ARM)
  run_f "yarn e2e:android:genycloud e2e/01* e2e/02* e2e/03.actions*"
  cp coverage/lcov.info ../../coverage/e2e-genycloud-ci.lcov
fi

run_f "scripts/ci_unhappy.sh android"

# run_f "yarn verify-artifacts:android"
popd
