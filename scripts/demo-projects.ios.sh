#!/bin/bash -e

UPLOAD_ARTIFACT="$(pwd)/scripts/upload_artifact.sh"
trap "$UPLOAD_ARTIFACT" EXIT

SCRIPTS_PATH="$( cd -- "$(dirname "$0")" >/dev/null 2>&1 ; pwd -P )"

source $SCRIPTS_PATH/demo-projects.sh

# This must be built first as all other demo apps use this binary.
pushd examples/demo-react-native
  pushd ios
    run_f "pod install"
  popd

  # Release: the debug build needs a running Metro, which the v21 alpha
  # does not start for the app.
  run_f "yarn build:ios-release"
  run_f "yarn test:ios-release"

  # Run tests with bloated JS bundle:
  source $SCRIPTS_PATH/demo-rn-bloat-bundle-test.sh ios
popd
