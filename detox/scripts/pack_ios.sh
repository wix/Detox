#!/bin/bash -e

rm -rf Detox-ios-src.tbz
rm -rf Detox-ios-framework.tbz
rm -rf Detox-ios-xcuitest.tbz
rm -rf build_temp

find ./ios -name Build -type d -exec rm -rf {} \;

# Package sources
pushd . &> /dev/null
cd ios
tar --exclude-from=.tbzignore -cjf ../Detox-ios-src.tbz .
popd &> /dev/null

# Package prebuilt framework
mkdir build_temp
scripts/build_framework.ios.sh "ios/Detox.xcodeproj" "build_temp" &> build_temp/detox_ios.log
pushd . &> /dev/null
cd build_temp
tar --exclude-from=../ios/.tbzignore -cjf ../Detox-ios-framework.tbz .
popd &> /dev/null

# Package prebuilt xcuitest runner
scripts/build_xcuitest.ios.sh "ios/DetoxTester.xcworkspace" "build_temp" &> build_temp/detox_ios_xcuitest.log
pushd . &> /dev/null
cd build_temp
tar --exclude-from=../ios/.tbzignore -cjf ../Detox-ios-xcuitest.tbz .
popd &> /dev/null

# Cleanup
rm -fr build_temp
