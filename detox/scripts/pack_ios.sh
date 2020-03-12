#!/bin/bash -e

rm -rf Detox-ios-src.tbz
rm -rf Detox-ios.tbz
rm -rf build_temp

ios/EarlGrey/Scripts/setup-earlgrey.sh
find ./ios -name Build -type d -exec rm -rf {} \;

#Package sources
pushd . &> /dev/null
cd ios
tar --exclude-from=.tbzignore -cjf ../Detox-ios-src.tbz .
popd &> /dev/null

#Package prebuilt framework
mkdir build_temp
scripts/build_universal_framework.sh "ios/Detox.xcodeproj" "build_temp" &> build_temp/detox_ios.log
pushd . &> /dev/null
cd build_temp
tar --exclude-from=../ios/.tbzignore -cjf ../Detox-ios.tbz .
popd &> /dev/null

rm -fr build_temp
