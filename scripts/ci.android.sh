#!/bin/bash -e

$(dirname "$0")/ci.sh

echo no | "$ANDROID_HOME"/tools/bin/avdmanager create avd --force --name Nexus_5X_API_26 -t android-26 --abi armeabi-v7a --device "Nexus 5X"
pushd detox/test
npm run build:android
npm run e2e:android
popd
