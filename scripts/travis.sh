#!/bin/bash

set -e

pwd

cd detox

npm install -g react-native-cli

npm install
npm run build

cd test
rm -rf node_modules
rm -rf ios/build
npm install
export RCT_NO_LAUNCH_PACKAGER=true && xcodebuild -project ios/example.xcodeproj -scheme example -configuration Release -sdk iphonesimulator -derivedDataPath ios/build
./node_modules/.bin/detox-server &
npm run e2e
pkill -f "detox-server" || true