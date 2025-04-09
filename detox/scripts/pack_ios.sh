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
mkdir build_temp_framework

# Package prebuilt framework
scripts/build_framework.ios.sh "ios/Detox.xcodeproj" "build_temp_framework"
cd build_temp_framework
tar --exclude-from=../ios/.tbzignore -cjf ../Detox-ios-framework.tbz .
cd ..
rm -rf build_temp_framework


# Create temp build directory
mkdir build_temp_xcuitest

# Package prebuilt XCUITest runner
scripts/build_xcuitest.ios.sh "ios/DetoxXCUITestRunner/DetoxXCUITestRunner.xcodeproj" "build_temp_xcuitest"
cd build_temp_xcuitest
tar --exclude-from=../ios/.tbzignore -cjf ../Detox-ios-xcuitest.tbz .
cd ..
rm -rf build_temp_xcuitest
