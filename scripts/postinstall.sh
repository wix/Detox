#!/bin/bash -e

if [ "$(uname)" == "Darwin" ]; then
  cd detox/test/ios
  pod install
fi
