#!/bin/bash -e

source $(dirname "$0")/travis_logger.sh
run_f "lerna bootstrap"

run_f "lerna run --ignore detox-demo* build"
run_f "lerna run --ignore detox-demo* test"
