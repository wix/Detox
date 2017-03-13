#!/bin/bash -e

lerna bootstrap

cd detox
npm run unit
npm run build -- noframework
set -o pipefail && xcodebuild -project ios/Detox.xcodeproj -scheme Detox -configuration Debug test -destination 'platform=iOS Simulator,name=iPhone 7 Plus' | xcpretty

cd test
set -o pipefail && export RCT_NO_LAUNCH_PACKAGER=true && xcodebuild -project ios/example.xcodeproj -scheme example -configuration Release -sdk iphonesimulator -derivedDataPath ios/build | xcpretty
npm run e2e
pkill -f "detox-server" || true