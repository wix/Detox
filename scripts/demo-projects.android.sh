#!/bin/bash -e

# Approve unapproved SDK licenses
yes | $ANDROID_HOME/tools/bin/sdkmanager --licenses

source $(dirname "$0")/demo-projects.sh

pushd detox/android
run_f "./gradlew publish -Dversion=999.999.999"
popd

pushd examples/demo-react-native
run_f "npm run build:android-release"
run_f "npm run test:android-release-ci -- --device-launch-args=\"-read-only\""
run_f "npm run test:android-explicit-require-ci"
popd

pushd examples/demo-react-native-jest
run_f "npm run test:android-release-ci"
run_f "npm run test:jest-circus:android-release-ci"
popd
