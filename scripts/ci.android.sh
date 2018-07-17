#!/bin/bash -e

source $(dirname "$0")/ci.sh

pushd detox/android
run_f "./gradlew test"
popd

if [ $JENKINS_CI ] ; then
    pushd detox/test
    # Workaround until react android issue will be fixed - react-native: 0.55
    mv node_modules/react-native/ReactAndroid/release.gradle node_modules/react-native/ReactAndroid/release.gradle.bak
    cp extras/release.gradle node_modules/react-native/ReactAndroid/

    run_f "npm run build:android"
    run_f "npm run e2e:android -- --headless"
    popd
fi
