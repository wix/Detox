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

XCUITEST_OUTPUT_DIR_TEMP = "${XCUITEST_OUTPUT_DIR}/Temp"

mkdir -p "${XCUITEST_OUTPUT_DIR_TEMP}"

env -i bash -c "xcodebuild -project \"${XCODEPROJ}\" -scheme \"${PROJECT_NAME}\" -UseNewBuildSystem=\"YES\" -configuration \"${CONFIGURATION}\" -sdk iphonesimulator -destination 'generic/platform=iOS Simulator' -derivedDataPath \"${XCUITEST_OUTPUT_DIR_TEMP}\" build-for-testing -quiet"

# Find the .xctestrun file inside the output directory, copy it, and remove the rest

XCTESTRUN_FILE=$(find "${XCUITEST_OUTPUT_DIR_TEMP}" -name "*.xctestrun")

# Copy the .xctestrun file to the output directory

cp "${XCTESTRUN_FILE}" "${XCUITEST_OUTPUT_DIR}/Detox.xctestrun"

# Remove the temp directory

rm -fr "${XCUITEST_OUTPUT_DIR_TEMP}"
