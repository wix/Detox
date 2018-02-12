#!/bin/bash -e

source $(dirname "$0")/ci.sh

run_f "$(dirname "$0")/unit.ios.sh"

pushd detox/test
run_f "npm run build:ios"
run_f "npm run e2e:ios"
popd
#npm run release
