#!/bin/bash -e

npm install -g lerna@2.0.0-beta.34 >/dev/null 2>&1
npm install -g react-native-cli >/dev/null 2>&1
gem install xcpretty >/dev/null 2>&1

lerna bootstrap

cd detox
npm run unit
npm run build -- noframework
set -o pipefail && xcodebuild -project ios/Detox.xcodeproj -scheme Detox -configuration Debug test -destination 'platform=iOS Simulator,name=iPhone 7 Plus,OS=10.2' | xcpretty

cd test
set -o pipefail && export RCT_NO_LAUNCH_PACKAGER=true && xcodebuild -project ios/example.xcodeproj -scheme example -configuration Release -sdk iphonesimulator -derivedDataPath ios/build | xcpretty
npm run detox-server &
npm run e2e
pkill -f "detox-server" || true