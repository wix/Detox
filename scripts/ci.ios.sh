#!/bin/bash -e

$(dirname "$0")/ci.sh

set -o pipefail && xcodebuild -project detox/ios/Detox.xcodeproj -scheme Detox -configuration Debug -sdk iphonesimulator build-for-testing | xcpretty
set -o pipefail && xcodebuild -project detox/ios/Detox.xcodeproj -scheme Detox -configuration Debug -sdk iphonesimulator test-without-building -destination 'platform=iOS Simulator,name=iPhone 7 Plus' | xcpretty

pushd detox/test
npm run build:ios
npm run e2e:ios
popd
#npm run release