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

  run_f "npm run build:ios-debug"
  run_f "npm run test:ios-debug"

  # Run tests with bloated JS bundle:
  source $SCRIPTS_PATH/demo-rn-bloat-bundle-test.sh ios
popd

