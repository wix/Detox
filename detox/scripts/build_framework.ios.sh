#!/bin/bash -e

PROJECT=$1
FRAMEWORK_OUTPUT_DIR=$2
CONFIGURATION=Release
PROJECT_NAME=Detox

# Make sure the output directory exists

rm -fr "${FRAMEWORK_OUTPUT_DIR}"
mkdir -p "${FRAMEWORK_OUTPUT_DIR}"

# Step 0. Xcode version

USE_NEW_BUILD_SYSTEM="YES"
echo "Using -UseNewBuildSystem=${USE_NEW_BUILD_SYSTEM}"

# Step 1. Build Device and Simulator versions

BUILD_SIM=`xcodebuild -project "${PROJECT}" -scheme "Detox" -UseNewBuildSystem=${USE_NEW_BUILD_SYSTEM} -configuration "${CONFIGURATION}" -sdk iphonesimulator -destination "generic/platform=iOS Simulator" build -showBuildSettings  | awk -F= '/TARGET_BUILD_DIR/{x=$NF; gsub(/^[ \t]+|[ \t]+$/,"",x); print x}'`

echo ${BUILD_SIM}

xcodebuild -project "${PROJECT}" -scheme "Detox" -UseNewBuildSystem=${USE_NEW_BUILD_SYSTEM} -configuration "${CONFIGURATION}" -sdk iphonesimulator -destination "generic/platform=iOS Simulator" build -quiet

# Step 2. Copy the framework to output folder

cp -fR "${BUILD_SIM}/${PROJECT_NAME}.framework" "${FRAMEWORK_OUTPUT_DIR}"/
