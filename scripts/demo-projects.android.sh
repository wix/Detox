#!/bin/bash -e

# Approve unapproved SDK licenses
yes | $ANDROID_HOME/cmdline-tools/latest/bin/sdkmanager --licenses

source $(dirname "$0")/demo-projects.sh

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

pushd examples/demo-react-native
run_f "npm run test:android-release-ci"
DETOX_EXPOSE_GLOBALS=0 run_f "npm run test:android-release-ci"
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
