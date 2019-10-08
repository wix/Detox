#!/bin/bash -e

DERIVED_DATA_PATH=test_build
TARGET_BUILT_DIR=TestRunnerProduct

rm -fr "$TARGET_BUILT_DIR"
rm -fr "$DERIVED_DATA_PATH"
xcodebuild -project Detox.xcodeproj -scheme DetoxTestRunner -destination 'platform=iOS Simulator,name=iPhone 11 Pro Max' -configuration Release build-for-testing -derivedDataPath "$DERIVED_DATA_PATH"

mkdir -p "$TARGET_BUILT_DIR"
cp -R "$DERIVED_DATA_PATH"/Build/Products/* "$TARGET_BUILT_DIR"
mv "$TARGET_BUILT_DIR"/DetoxTestRunner_iphonesimulator13.2-x86_64.xctestrun "$TARGET_BUILT_DIR"/DetoxTestRunner.xctestrun

rm -fr "$DERIVED_DATA_PATH"