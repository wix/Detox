#!/bin/bash -ex

if [ ! -z ${REACT_NATIVE_VERSION} ]; then
  node scripts/change_react_native_version.js "examples/demo-react-native" ${REACT_NATIVE_VERSION} "dependencies"
  node scripts/change_react_native_version.js "detox/test" ${REACT_NATIVE_VERSION} "dependencies"
  node scripts/change_react_native_version.js "detox" ${REACT_NATIVE_VERSION} "devDependencies"

  YARN_ENABLE_IMMUTABLE_INSTALLS=false yarn install
fi
