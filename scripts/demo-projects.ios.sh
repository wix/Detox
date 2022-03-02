#!/bin/bash -e

source $(dirname "$0")/demo-projects.sh

# This must be built first as all other demo apps use this binary.
pushd examples/demo-react-native
pushd ios
run_f "pod install"
popd
run_f "detox build -c ios.sim.release"
run_f "detox test -c ios.sim.release"
DETOX_EXPOSE_GLOBALS=0 run_f "detox test -c ios.sim.release"
popd

pushd examples/demo-react-native-jest
run_f "npm run test:ios-release-ci"
DETOX_EXPOSE_GLOBALS=0 run_f "npm run test:ios-release-ci"
popd
