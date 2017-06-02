#!/bin/bash -e

lerna bootstrap
lerna run --ignore detox-demo*  build
lerna run --ignore detox-demo*  test

set -o pipefail && xcodebuild -project detox/ios/Detox.xcodeproj -scheme Detox -configuration Debug -sdk iphonesimulator build-for-testing | xcpretty
set -o pipefail && xcodebuild -project detox/ios/Detox.xcodeproj -scheme Detox -configuration Debug -sdk iphonesimulator test-without-building -destination 'platform=iOS Simulator,name=iPhone 7 Plus' | xcpretty

npm run e2e
#npm run release