#!/bin/bash -e

source $(dirname "$0")/logger.sh
source $(dirname "$0")/install.sh

if [ ! -z ${REACT_NATIVE_VERSION} ]; then
  node scripts/change_react_native_version.js "detox/test" ${REACT_NATIVE_VERSION} "dependencies"
  node scripts/change_react_native_version.js "detox" ${REACT_NATIVE_VERSION} "devDependencies"
fi

run_f "lerna bootstrap --no-ci"
run_f "lerna run build"

if [ "$1" == 'noGenerate' ]; then
  run_f "lerna run test --ignore=generation"
else
  run_f "lerna run test"
fi

pushd detox
allure generate || echo "Allure is not installed"
popd
