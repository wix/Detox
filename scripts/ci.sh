#!/bin/bash -e

source $(dirname "$0")/travis_logger.sh

case "$REACT_NATIVE_VERSION" in
     0.44.2)
          echo "Applying git patch to convert React Native version in test project to $REACT_NATIVE_VERSION"
          git apply scripts/testProjRN49to44.diff --ignore-whitespace
          ;;
esac

run_f "$(dirname "$0")/bootstrap.sh"

run_f "lerna run --ignore detox-demo* build"
run_f "lerna run --ignore detox-demo* test"
