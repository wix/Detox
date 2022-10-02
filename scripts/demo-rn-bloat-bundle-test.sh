#!/bin/bash -e

echo "Bloating the demo project bundle"
run_f "npm run bloat-bundle"

run_f "npm run build:ios-release"
run_f "npm run test:ios-release-ci"

echo "Unbloating the demo project bundle"
run_f "git restore ."
