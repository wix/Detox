#!/bin/bash -e

if [ ! -z ${REACT_NATIVE_VERSION} ]; then
  node scripts/change_react_native_version.js "detox/test" ${REACT_NATIVE_VERSION}
fi

lerna bootstrap

lerna run --ignore detox-demo* build
lerna run --ignore detox-demo* test
