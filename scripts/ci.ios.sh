#!/bin/bash -e

source $(dirname "$0")/ci.sh

$(dirname "$0")/unit.ios.sh

pushd detox/test
npm run build:ios
npm run e2e:ios
popd
