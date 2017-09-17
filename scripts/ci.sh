#!/bin/bash -e

lerna bootstrap
npm run build

set -o pipefail && xcodebuild -project detox/ios/Detox.xcodeproj -scheme Detox -configuration Debug -sdk iphonesimulator build-for-testing | xcpretty
set -o pipefail && xcodebuild -project detox/ios/Detox.xcodeproj -scheme Detox -configuration Debug -sdk iphonesimulator test-without-building -destination 'platform=iOS Simulator,name=iPhone 7 Plus' | xcpretty


npm test
#npm run release