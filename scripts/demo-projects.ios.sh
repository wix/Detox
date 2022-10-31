#!/bin/bash -e

UPLOAD_ARTIFACT="$(pwd)/scripts/upload_artifact.sh"
trap "$UPLOAD_ARTIFACT" EXIT

SCRIPTS_PATH="$(dirname "$0")"

source $SCRIPTS_PATH/demo-projects.sh

# This must be built first as all other demo apps use this binary.
pushd examples/demo-react-native
  pushd ios
    run_f "pod install"
  popd

  run_f "npm run build:ios-release"
popd

pushd examples/demo-react-native-jest
  run_f "npm run test:ios-release-ci"
popd

pushd examples/demo-react-native
  run_f "npm run test:ios-release-ci"

  # Run tests with bloated JS bundle:
  source $SCRIPTS_PATH/demo-rn-bloat-bundle-test.sh ios
popd

