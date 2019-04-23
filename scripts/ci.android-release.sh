#!/usr/bin/env bash

source $(dirname "$0")/logger.sh

run_f "lerna bootstrap"

pushd detox/android
run_f "./gradlew publish -Dversion=${RELEASE_VERSION}"
popd
