#!/bin/bash -e

npm install -g lerna
npm install -g react-native-cli
gem install xcpretty

lerna bootstrap

cd detox
npm run build

cd test
(export RCT_NO_LAUNCH_PACKAGER=true && xcodebuild -project ios/example.xcodeproj -scheme example -configuration Release -sdk iphonesimulator -derivedDataPath ios/build) | xcpretty
npm run detox-server &
npm run e2e
pkill -f "detox-server" || true