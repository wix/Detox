#!/bin/bash -e

XCODEPROJ=$1
XCUITEST_OUTPUT_DIR=$2
CONFIGURATION=Release
PROJECT_NAME=DetoxXCUITestRunner

# Clean up the output directory

rm -fr "${XCUITEST_OUTPUT_DIR}"

# Make sure the output directory exists

mkdir -p "${XCUITEST_OUTPUT_DIR}"

# Build Simulator version

xcodebuild -project "${XCODEPROJ}" -scheme "${PROJECT_NAME}" -UseNewBuildSystem="YES" -configuration "${CONFIGURATION}" -sdk iphonesimulator -destination 'generic/platform=iOS Simulator' -derivedDataPath "${XCUITEST_OUTPUT_DIR}" build-for-testing -quiet
