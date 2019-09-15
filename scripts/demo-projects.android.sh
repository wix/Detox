#!/bin/bash -e

# Approve unapproved SDK licenses
yes | $ANDROID_HOME/tools/bin/sdkmanager --licenses

source $(dirname "$0")/demo-projects.sh

pushd detox/android
run_f "./gradlew publish -Dversion=999.999.999"
popd

pushd examples/demo-react-native
run_f "npm run build:android-release"
run_f "npm run test:android-release -- --headless"
run_f "npm run test:android-explicit-require -- --headless"
popd

pushd examples/demo-react-native-jest
killall -9 qemu-system-x86_64 # Because jest-parallel needs emu's from scratch in read-only mode
run_f "npm run test:android-release-ci -- --headless"
run_f "npm run test:jest-circus:android-release-ci -- --headless"
popd
