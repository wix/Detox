#!/bin/bash -e

UPLOAD_ARTIFACT="$(pwd)/scripts/upload_artifact.sh"
trap "$UPLOAD_ARTIFACT" EXIT

# Approve unapproved SDK licenses
yes | $ANDROID_HOME/cmdline-tools/latest/bin/sdkmanager --licenses

SCRIPTS_PATH="$(dirname "$0")"

source $SCRIPTS_PATH/demo-projects.sh

pushd detox
run_f "npm run build:android"
popd

pushd examples/demo-react-native
run_f "npm run build:android-release"
popd

# this needs to go first because it preloads all the emulators we need,
# as it runs tests in parallel. Also, it installs test-butler on them -
# even for forward usage.
pushd examples/demo-react-native-jest
  run_f "npm run test:android-release-ci"
  DETOX_EXPOSE_GLOBALS=0 run_f "npm run test:android-release-ci"
popd

# Early completion if this is just about RN compatibility -
# in which case, running the demo project's tests is enough.
if [ "$REACT_NATIVE_COMPAT_TEST" = "true" ]; then
  exit 0
fi

pushd examples/demo-react-native
  run_f "npm run test:android-release-ci"
  DETOX_EXPOSE_GLOBALS=0 run_f "npm run test:android-release-ci"

  # Run tests with bloated JS bundle:
  source $SCRIPTS_PATH/demo-rn-bloat-bundle-test.sh android
popd

pushd examples/demo-plugin
  run_f "npm run test:plugin"
popd

# Detox Native
##

pushd detox
  run_f "npm run build:android-native"
popd

pushd examples/demo-pure-native-android
  export ANDROID_SERIAL=`adb devices | grep emulator | head -1 | awk '{print $1}'`
  run_f "./gradlew connectAndroidTest"
popd
