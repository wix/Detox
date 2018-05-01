#!/bin/bash -e

source $(dirname "$0")/travis_logger.sh

if [ ! -z ${REACT_NATIVE_VERSION} ]; then
  node scripts/change_react_native_version.js "examples/demo-react-native" ${REACT_NATIVE_VERSION}
  node scripts/change_react_native_version.js "examples/demo-react-native-jest" ${REACT_NATIVE_VERSION}
fi

lerna bootstrap

pushd examples/demo-react-native
run_f "detox build -c ios.sim.release"
run_f "detox test -c ios.sim.release"
run_f "detox test -c ios.sim.release --specs e2eExplicitRequire --runner-config e2eExplicitRequire/mocha.opts"
popd

pushd examples/demo-react-native-jest
run_f "detox build -c ios.sim.release"
run_f "detox test -c ios.sim.release"
popd
