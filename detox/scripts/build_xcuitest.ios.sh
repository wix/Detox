#!/bin/bash -e

WORKSPACE=$1
XCUITEST_OUTPUT_DIR=$2
CONFIGURATION=Release
PROJECT_NAME=DetoxTester

# Clean up the output directory

rm -fr "${XCUITEST_OUTPUT_DIR}"

# Make sure the output directory exists

mkdir -p "${XCUITEST_OUTPUT_DIR}"

# Xcode version

USE_NEW_BUILD_SYSTEM="YES"
echo "Using -UseNewBuildSystem=${USE_NEW_BUILD_SYSTEM}"

# Build Simulator version

xcodebuild -workspace "${WORKSPACE}" -scheme "${PROJECT_NAME}" -UseNewBuildSystem=${USE_NEW_BUILD_SYSTEM} -configuration "${CONFIGURATION}" -sdk iphonesimulator -destination 'generic/platform=iOS Simulator' -derivedDataPath "${XCUITEST_OUTPUT_DIR}" -allowProvisioningUpdates build-for-testing -quiet
