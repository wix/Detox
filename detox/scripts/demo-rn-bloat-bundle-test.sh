#!/bin/bash -ex
# This script is used to run the demo project' tests with a bloated JS bundle.
# See the original issue for the motivation behind this: https://github.com/wix/Detox/issues/3507

OS_PLATFORM=$1
WORKING_DIR=$(pwd)
BUNDLE_FILE=app.js
BUNDLE_PATH=$WORKING_DIR/$BUNDLE_FILE

echo "Bloating the demo project bundle for $OS_PLATFORM"

# Copy the original bundle to a temporary location:
cp $BUNDLE_PATH $BUNDLE_PATH.original

# Bloat the bundle:
npm run bloat-bundle -- ./$BUNDLE_FILE

# Run the tests:
npm run build:$OS_PLATFORM-release
npm run test:$OS_PLATFORM-release

# Reverse the bloating:
mv $BUNDLE_PATH.original $BUNDLE_PATH
