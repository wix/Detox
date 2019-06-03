#!/bin/bash -e

# TODO Remove this once migration is merged-in. It's only needed for the transitional state.
echo "*** Forcing react-native version to 0.59.8 instead of $REACT_NATIVE_VERSION ***"
export REACT_NATIVE_VERSION="0.59.8"

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
run_f "npm run build:android-release"
run_f "npm run test:android-release -- --headless"
popd
