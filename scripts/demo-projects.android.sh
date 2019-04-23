#!/bin/bash -e

source $(dirname "$0")/demo-projects.sh

pushd detox/android
run_f "./gradlew publish -Dversion=999.999.999"
popd

pushd examples/demo-react-native
run_f "npm run build:android-release"
run_f "npm run test:android-release -- --headless"
run_f "npm run test:android-explicit-require -- --headless"
popd

pushd examples/demo-react-native-jest
run_f "npm run build:android-release"
run_f "npm run test:android-release -- --headless"
popd
