#!/usr/bin/env bash

$(dirname "$0")/bootstrap.sh

cd examples/demo-react-native
detox build -c ios.sim.release
detox test -c ios.sim.release

cd examples/demo-react-native-jest
detox build -c ios.sim.release
detox test -c ios.sim.release