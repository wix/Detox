PROJECT=$1
OUTPUT_DIR=$2
CONFIGURATION=Release
PROJECT_NAME=Detox

set -e

function remove_arch() {
    lipo -create "${1}" "${2}" -output "${3}"
}

# Make sure the output directory exists

mkdir -p "${OUTPUT_DIR}"
rm -fr "${OUTPUT_DIR}/${PROJECT_NAME}.framework"

TEMP_DIR=$(mktemp -d "$TMPDIR"DetoxBuild.XXXX)
echo TEMP_DIR = "${TEMP_DIR}"

# Step 0. Xcode version

XCODEVERSION=$(xcodebuild -version | grep -oEi "([0-9]*\.[0-9]*)")
echo "Xcode ${XCODEVERSION}"
USE_NEW_BUILD_SYSTEM="YES"
if [ "${XCODEVERSION}" != "`echo -e "${XCODEVERSION}\n11.0" | sort --version-sort -r | head -n1`" ]; then
  USE_NEW_BUILD_SYSTEM="NO"
fi
echo "Using -UseNewBuildSystem=${USE_NEW_BUILD_SYSTEM}"

# Step 1. Build Device and Simulator versions

BUILD_IOS=`xcodebuild -project "${PROJECT}" -UseNewBuildSystem=${USE_NEW_BUILD_SYSTEM} -scheme Detox -configuration "${CONFIGURATION}" -arch arm64  -sdk iphoneos        ONLY_ACTIVE_ARCH=NO VALID_ARCHS=arm64  -showBuildSettings  | awk -F= '/TARGET_BUILD_DIR/{x=$NF; gsub(/^[ \t]+|[ \t]+$/,"",x); print x}'`
BUILD_SIM=`xcodebuild -project "${PROJECT}" -UseNewBuildSystem=${USE_NEW_BUILD_SYSTEM} -scheme Detox -configuration "${CONFIGURATION}" -arch x86_64 -sdk iphonesimulator ONLY_ACTIVE_ARCH=NO VALID_ARCHS=x86_64 -showBuildSettings  | awk -F= '/TARGET_BUILD_DIR/{x=$NF; gsub(/^[ \t]+|[ \t]+$/,"",x); print x}'`

echo ${BUILD_IOS}
echo ${BUILD_SIM}

xcodebuild -project "${PROJECT}" -UseNewBuildSystem=${USE_NEW_BUILD_SYSTEM} -scheme Detox -configuration "${CONFIGURATION}" -arch arm64  -sdk iphoneos        ONLY_ACTIVE_ARCH=NO clean build VALID_ARCHS=arm64
xcodebuild -project "${PROJECT}" -UseNewBuildSystem=${USE_NEW_BUILD_SYSTEM} -scheme Detox -configuration "${CONFIGURATION}" -arch x86_64 -sdk iphonesimulator ONLY_ACTIVE_ARCH=NO       build VALID_ARCHS=x86_64

# Step 2. Copy the framework structure (from iphoneos build) to the universal folder

cp -fR "${BUILD_IOS}/${PROJECT_NAME}.framework" "${TEMP_DIR}/"

# Step 3. Copy Swift modules from iphonesimulator build (if it exists) to the copied framework directory

SIMULATOR_SWIFT_MODULES_DIR="${BUILD_SIM}/${PROJECT_NAME}.framework/Modules/${PROJECT_NAME}.swiftmodule/."
if [ -d "${SIMULATOR_SWIFT_MODULES_DIR}" ]; then
cp -fR "${SIMULATOR_SWIFT_MODULES_DIR}" "${TEMP_DIR}/${PROJECT_NAME}.framework/Modules/${PROJECT_NAME}.swiftmodule"
fi

# Step 4. Create universal binary file using lipo and place the combined executable in the copied framework directory

remove_arch "${BUILD_SIM}/${PROJECT_NAME}.framework/${PROJECT_NAME}" "${BUILD_IOS}/${PROJECT_NAME}.framework/${PROJECT_NAME}" "${TEMP_DIR}/${PROJECT_NAME}.framework/${PROJECT_NAME}"

# Step 5. Create universal binaries for embedded frameworks

for SUB_FRAMEWORK in $( ls "${TEMP_DIR}/${PROJECT_NAME}.framework/Frameworks" ); do
if [ -d "${TEMP_DIR}/${PROJECT_NAME}.framework/Frameworks/$SUB_FRAMEWORK" ]; then
echo "Processing ${SUB_FRAMEWORK} as a dir"
BINARY_NAME="${SUB_FRAMEWORK%.*}"

remove_arch "${BUILD_SIM}/${PROJECT_NAME}.framework/Frameworks/${SUB_FRAMEWORK}/${BINARY_NAME}" "${BUILD_IOS}/${PROJECT_NAME}.framework/Frameworks/${SUB_FRAMEWORK}/${BINARY_NAME}" "${TEMP_DIR}/${PROJECT_NAME}.framework/Frameworks/${SUB_FRAMEWORK}/${BINARY_NAME}"

else
echo "Processing ${SUB_FRAMEWORK} as a file"

remove_arch "${BUILD_SIM}/${PROJECT_NAME}.framework/Frameworks/${SUB_FRAMEWORK}" "${BUILD_IOS}/${PROJECT_NAME}.framework/Frameworks/${SUB_FRAMEWORK}" "${TEMP_DIR}/${PROJECT_NAME}.framework/Frameworks/${SUB_FRAMEWORK}"

fi
done

mv "${TEMP_DIR}/${PROJECT_NAME}.framework" "${OUTPUT_DIR}"/
rm -fr "${TEMP_DIR}"
