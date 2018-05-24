#!/bin/bash -e

source $(dirname "$0")/logger.sh

if [ ! -z ${REACT_NATIVE_VERSION} ]; then
  for proj in demo-react-native demo-react-native-jest; do
    node scripts/change_react_native_version.js "examples/${proj}" ${REACT_NATIVE_VERSION}
  done
fi

run_f "lerna bootstrap"

pushd examples/demo-react-native
run_f "detox build -c ios.sim.release"
run_f "detox test -c ios.sim.release"
run_f "detox test -c ios.sim.release --specs e2eExplicitRequire --runner-config e2eExplicitRequire/mocha.opts"
popd

pushd examples/demo-react-native-jest
run_f "detox build -c ios.sim.release"
run_f "detox test -c ios.sim.release"
popd
