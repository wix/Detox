#!/bin/bash -ex

if [ ! -z ${REACT_NATIVE_VERSION} ]; then
  node scripts/change_react_native_version.js "examples/demo-react-native" ${REACT_NATIVE_VERSION} "dependencies"
  node scripts/change_react_native_version.js "detox/test" ${REACT_NATIVE_VERSION} "dependencies"
  node scripts/change_react_native_version.js "detox" ${REACT_NATIVE_VERSION} "devDependencies"

  # Update lockfile for the new RN version
  yarn install --mode update-lockfile
fi
