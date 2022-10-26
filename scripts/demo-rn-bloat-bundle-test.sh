#!/bin/bash -e

OS_PLATFORM=$1

echo "Bloating the demo project bundle for $OS_PLATFORM"
run_f "npm run bloat-bundle"

run_f "npm run build:$OS_PLATFORM-release"
run_f "npm run test:$OS_PLATFORM-release-ci"

echo "Unbloating the demo project bundle"
run_f "git restore ."
