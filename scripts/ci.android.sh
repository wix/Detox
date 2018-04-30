#!/bin/bash -e

$(dirname "$0")/ci.sh

pushd detox/android
./gradlew test
popd
#echo no | "$ANDROID_HOME"/tools/bin/avdmanager create avd --force --name Nexus_5X_API_26  --abi armeabi-v7a --device "Nexus 5X" -k system-images;android-26;default;armeabi-v7a

if [ $JENKINS_CI ] ; then
    pushd detox/test
    # Workaround until react android issue will be fixed - react-native: 0.55
    mv node_modules/react-native/ReactAndroid/release.gradle node_modules/react-native/ReactAndroid/release.gradle.bak
    cp extras/release.gradle node_modules/react-native/ReactAndroid/

    npm run build:android
    npm run e2e:android -- --headless
    popd
fi
