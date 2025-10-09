#!/bin/bash -ex

UPLOAD_ARTIFACT="$(pwd)/scripts/upload_artifact.sh"
trap "$UPLOAD_ARTIFACT" EXIT

### Approve unapproved SDK licenses
yes | $ANDROID_HOME/cmdline-tools/latest/bin/sdkmanager --licenses

source $(dirname "$0")/ci.sh

### JS integration tests
pushd detox/test
run_f "npm run integration"
popd

### Android native unit tests
pushd detox/android
run_f "npm run unit:android-release"
popd

mkdir -p coverage

### E2E self-tests
pushd detox/test

run_f "npm run build:android-debug" # Workaround for asyncstorage issue https://github.com/react-native-async-storage/async-storage/issues/1216. Can be removed after fixing it
run_f "npm run build:android"

if [ "$USE_GOOGLE_ARM64" = "true" ]; then
  run_f "npm run e2e:android"
else
  run_f "npm run e2e:android:genycloud"
fi
cp coverage/lcov.info ../../coverage/e2e-genycloud-ci.lcov

run_f "scripts/ci_unhappy.sh android"

# run_f "npm run verify-artifacts:android"
popd
