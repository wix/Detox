#!/bin/bash -e
# This script is used to run the demo project' tests with a bloated JS bundle.
# See the original issue for the motivation behind this: https://github.com/wix/Detox/issues/3507

OS_PLATFORM=$1

echo "Bloating the demo project bundle for $OS_PLATFORM"
run_f "npm run bloat-bundle"

run_f "npm run build:$OS_PLATFORM-release"
run_f "npm run test:$OS_PLATFORM-release-ci"

echo "Unbloating the demo project bundle"
run_f "git restore ."
