#!/bin/bash -e

source $(dirname "$0")/demo-projects.sh

pushd examples/demo-react-native
run_f "./node_modules/.bin/detox build -c android.emu.release"
run_f "./node_modules/.bin/detox test -c android.emu.release --headless --loglevel verbose"
run_f "./node_modules/.bin/detox test e2eExplicitRequire -c android.emu.release --runner-config e2eExplicitRequire/mocha.opts --headless --loglevel verbose"
popd

pushd examples/demo-react-native-jest
run_f "./node_modules/.bin/detox build -c android.emu.release"
run_f "./node_modules/.bin/detox test -c android.emu.release --headless --loglevel verbose"
popd
