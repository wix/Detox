#!/bin/bash -e

if [ $# -ne 2 ]; then
    echo "usage: build_framework_ios.sh detoxIosSourceTarballDirPath detoxFrameworkDirPath"
    exit 1
fi

detoxIosSourceTarballDirPath="${1}"
detoxFrameworkDirPath="${2}"
detoxSourcePath="${detoxIosSourceTarballDirPath}"/ios_src


echo "###############################"
echo "Extracting Detox sources..."

mkdir -p "${detoxSourcePath}"
tar -xjf "${detoxIosSourceTarballDirPath}"/Detox-ios-src.tbz -C "${detoxSourcePath}"

echo "###############################"


echo "###############################"
echo "Extracting Detox sources..."

mkdir -p "${detoxFrameworkDirPath}"
xcodebuild build -project "${detoxSourcePath}"/Detox.xcodeproj -scheme DetoxFramework -configuration Release -derivedDataPath "${detoxFrameworkDirPath}"/DetoxBuild BUILD_DIR="${detoxFrameworkDirPath}"/DetoxBuild/Build/Products &> "${detoxFrameworkDirPath}"/detox_ios.log
mv "${detoxFrameworkDirPath}"/DetoxBuild/Build/Products/Release-universal/Detox.framework "${detoxFrameworkDirPath}"
rm -fr "${detoxFrameworkDirPath}"/DetoxBuild

echo "###############################"
