#!/bin/bash -e

rm -rf Detox-ios-src.tbz
rm -rf Detox-ios-framework.tbz
rm -rf Detox-ios-xcuitest.tbz
rm -rf build_temp

find ./ios -name Build -type d -exec rm -rf {} \;

# Package sources
cd ios
tar --exclude-from=.tbzignore -cjf ../Detox-ios-src.tbz .
cd ..

echo "Packaging iOS sources and prebuilt frameworks"

# Create temp build directory
mkdir build_temp

# Package prebuilt framework
scripts/build_framework.ios.sh "ios/Detox.xcodeproj" "build_temp"

# Package prebuilt XCUITest runner
scripts/build_xcuitest.ios.sh "ios/DetoxXCUITestRunner/DetoxXCUITestRunner.xcodeproj" "build_temp"

cd build_temp
tar --exclude-from=../ios/.tbzignore -cjf ../Detox-ios-xcuitest.tbz .
tar --exclude-from=../ios/.tbzignore -cjf ../Detox-ios-framework.tbz .
cd ..

# Cleanup
rm -fr build_temp
