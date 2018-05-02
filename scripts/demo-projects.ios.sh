#!/bin/bash -e

if [ ! -z ${REACT_NATIVE_VERSION} ]; then
  for proj in demo-react-native demo-react-native-jest; do
    node scripts/change_react_native_version.js "examples/${proj}" ${REACT_NATIVE_VERSION}
  done
fi

lerna bootstrap

pushd examples/demo-react-native
detox build -c ios.sim.release
detox test -c ios.sim.release
detox test -c ios.sim.release --specs e2eExplicitRequire --runner-config e2eExplicitRequire/mocha.opts
popd

pushd examples/demo-react-native-jest
detox build -c ios.sim.release
detox test -c ios.sim.release
popd
