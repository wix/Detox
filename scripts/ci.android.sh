#!/bin/bash -e

$(dirname "$0")/ci.sh

pushd detox/test
npm run build:android
npm run e2e:android
popd
