#!/bin/bash -e

source $(dirname "$0")/logger.sh

pushd detox/android
./gradlew publish -Dversion=999.999.999
popd

pushd examples/demo-react-native
run_f "detox build -c android.emu.release"
run_f "detox test -c android.emu.release"
run_f "detox test e2eExplicitRequire -c android.emu.release --runner-config e2eExplicitRequire/mocha.opts"
popd

pushd examples/demo-react-native-jest
run_f "detox build -c android.emu.release"
run_f "detox test -c android.emu.release"
popd
