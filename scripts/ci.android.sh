#!/bin/bash -e

# TODO Remove this once migration is merged-in. It's only needed for the transitional state.
echo "*** Forcing react-native version to 0.59.8 instead of $REACT_NATIVE_VERSION ***"
export REACT_NATIVE_VERSION="0.59.8"

# Approve unapproved SDK licenses
yes | $ANDROID_HOME/tools/bin/sdkmanager --licenses

source $(dirname "$0")/ci.sh

pushd detox/android
run_f "./gradlew test"
popd

pushd detox/test
# Workaround until react android issue will be fixed - react-native: 0.55
mv node_modules/react-native/ReactAndroid/release.gradle node_modules/react-native/ReactAndroid/release.gradle.bak
cp extras/release.gradle node_modules/react-native/ReactAndroid/

run_f "npm run build:android"
run_f "npm run e2e:android-ci"
cp coverage/lcov.info coverage/e2e.lcov
# run_f "npm run verify-artifacts:android"
popd
