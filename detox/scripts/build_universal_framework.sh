PROJECT=$1
DERIVED_DATA=$2
CONFIGURATION=Release
PROJECT_NAME=Detox

set -e

function remove_arch() {
    lipo -create "${1}" "${2}" -output "${3}"
}

UNIVERSAL_OUTPUTFOLDER=${DERIVED_DATA}/Build/Products/${CONFIGURATION}-universal

# Make sure the output directory exists

mkdir -p "${UNIVERSAL_OUTPUTFOLDER}"

# Step 1. Build Device and Simulator versions

xcodebuild -project "${PROJECT}" -scheme Detox ONLY_ACTIVE_ARCH=NO -configuration ${CONFIGURATION} -arch arm64 -sdk iphoneos clean build VALID_ARCHS=arm64 -derivedDataPath "${DERIVED_DATA}"
xcodebuild -project "${PROJECT}" -scheme Detox -configuration ${CONFIGURATION} -arch x86_64 -sdk iphonesimulator ONLY_ACTIVE_ARCH=NO clean build VALID_ARCHS=x86_64 -derivedDataPath "${DERIVED_DATA}"

# Step 2. Copy the framework structure (from iphoneos build) to the universal folder

cp -R "${DERIVED_DATA}/Build/Products/${CONFIGURATION}-iphoneos/${PROJECT_NAME}.framework" "${UNIVERSAL_OUTPUTFOLDER}/"

# Step 3. Copy Swift modules from iphonesimulator build (if it exists) to the copied framework directory
SIMULATOR_SWIFT_MODULES_DIR="${DERIVED_DATA}/Build/Products/${CONFIGURATION}-iphonesimulator/${PROJECT_NAME}.framework/Modules/${PROJECT_NAME}.swiftmodule/."
if [ -d "${SIMULATOR_SWIFT_MODULES_DIR}" ]; then
cp -R "${SIMULATOR_SWIFT_MODULES_DIR}" "${UNIVERSAL_OUTPUTFOLDER}/${PROJECT_NAME}.framework/Modules/${PROJECT_NAME}.swiftmodule"
fi

# Step 4. Create universal binary file using lipo and place the combined executable in the copied framework directory

remove_arch "${DERIVED_DATA}/Build/Products/${CONFIGURATION}-iphonesimulator/${PROJECT_NAME}.framework/${PROJECT_NAME}" "${DERIVED_DATA}/Build/Products/${CONFIGURATION}-iphoneos/${PROJECT_NAME}.framework/${PROJECT_NAME}" "${UNIVERSAL_OUTPUTFOLDER}/${PROJECT_NAME}.framework/${PROJECT_NAME}"

# Step 5. Create universal binaries for embedded frameworks

for SUB_FRAMEWORK in $( ls "${UNIVERSAL_OUTPUTFOLDER}/${PROJECT_NAME}.framework/Frameworks" ); do
if [ -d "${UNIVERSAL_OUTPUTFOLDER}/${PROJECT_NAME}.framework/Frameworks/$SUB_FRAMEWORK" ]; then
echo "Processing ${SUB_FRAMEWORK} as a dir"
BINARY_NAME="${SUB_FRAMEWORK%.*}"

remove_arch "${DERIVED_DATA}/Build/Products/${CONFIGURATION}-iphonesimulator/${PROJECT_NAME}.framework/Frameworks/${SUB_FRAMEWORK}/${BINARY_NAME}" "${DERIVED_DATA}/Build/Products/${CONFIGURATION}-iphoneos/${PROJECT_NAME}.framework/Frameworks/${SUB_FRAMEWORK}/${BINARY_NAME}" "${UNIVERSAL_OUTPUTFOLDER}/${PROJECT_NAME}.framework/Frameworks/${SUB_FRAMEWORK}/${BINARY_NAME}"

else
echo "Processing ${SUB_FRAMEWORK} as a file"

remove_arch "${DERIVED_DATA}/Build/Products/${CONFIGURATION}-iphonesimulator/${PROJECT_NAME}.framework/Frameworks/${SUB_FRAMEWORK}" "${DERIVED_DATA}/Build/Products/${CONFIGURATION}-iphoneos/${PROJECT_NAME}.framework/Frameworks/${SUB_FRAMEWORK}" "${UNIVERSAL_OUTPUTFOLDER}/${PROJECT_NAME}.framework/Frameworks/${SUB_FRAMEWORK}"

fi
done
