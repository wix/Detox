#!/bin/bash -e

source $(dirname "$0")/travis_logger.sh
source $(dirname "$0")/ci.sh

pushd detox/test
run_f "npm run build:ios"
run_f "npm run e2e:ios"
popd
#npm run release
