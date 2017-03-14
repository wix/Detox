#!/bin/bash -e

lerna bootstrap
lerna run --ignore detox-demo*  build
lerna run --ignore detox-demo*  test

#cd detox

cd test
#set -o pipefail && export RCT_NO_LAUNCH_PACKAGER=true && xcodebuild -project ios/example.xcodeproj -scheme example -configuration Release -sdk iphonesimulator -derivedDataPath ios/build | xcpretty

npm run e2e