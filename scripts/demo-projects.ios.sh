#!/bin/bash -e

source $(dirname "$0")/demo-projects.sh

#This solves a bug in brew
HOMEBREW_NO_AUTO_UPDATE=1 brew untap wix/brew
HOMEBREW_NO_AUTO_UPDATE=1 brew tap wix/brew
HOMEBREW_NO_AUTO_UPDATE=1 brew cask reinstall detox-instruments

pushd examples/demo-react-native
run_f "detox build -c ios.sim.release"
run_f "detox test -c ios.sim.release"
run_f "detox test -c ios.sim.release e2eExplicitRequire --runner-config e2eExplicitRequire/mocha.opts"
popd

pushd examples/demo-react-native-jest
run_f "detox build -c ios.sim.release"
run_f "detox test -c ios.sim.release"
popd


pushd examples/demo-react-native-detox-instruments
run_f "detox build -c ios.sim.release"
run_f "detox test -c ios.sim.release --record-performance all --loglevel trace --record-logs all"
popd
