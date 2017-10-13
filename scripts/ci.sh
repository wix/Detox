#!/bin/bash -e

case "$REACT_NATIVE_VERSION" in
     0.44.2)
          echo "Applying git patch to convert React Native version in test project to $REACT_NATIVE_VERSION"
          git apply scripts/testProjRN49to44.diff
          ;;
esac

lerna bootstrap
lerna run --ignore detox-demo* build
lerna run --ignore detox-demo* test
