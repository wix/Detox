#!/bin/bash -e
# This script is used to run the demo project' tests with a bloated JS bundle.
# See the original issue for the motivation behind this: https://github.com/wix/Detox/issues/3507

OS_PLATFORM=$1
BUNDLE_PATH=./app.js

echo "Bloating the demo project bundle for $OS_PLATFORM"

# Copy the original bundle to a temporary location:
cp $BUNDLE_PATH $BUNDLE_PATH.original

# Bloat the bundle:
run_f "npm run bloat-bundle -- $BUNDLE_PATH"

# Run the tests:
run_f "npm run build:$OS_PLATFORM-release"
run_f "npm run test:$OS_PLATFORM-release-ci"

# Reverse the bloating:
mv $BUNDLE_PATH.original $BUNDLE_PATH
