#!/bin/bash -e

UPLOAD_ARTIFACT="$(pwd)/scripts/upload_artifact.sh"
trap "$UPLOAD_ARTIFACT" EXIT

# Approve unapproved SDK licenses
yes | $ANDROID_HOME/cmdline-tools/latest/bin/sdkmanager --licenses

SCRIPTS_PATH="$( cd -- "$(dirname "$0")" >/dev/null 2>&1 ; pwd -P )"

source $SCRIPTS_PATH/demo-projects.sh

pushd detox
run_f "npm run build:android"
popd

pushd examples/demo-react-native
  run_f "npm run build:android-debug"
  run_f "npm run test:android-debug"

  # Run tests in release mode with bloated JS bundle:
  source $SCRIPTS_PATH/demo-rn-bloat-bundle-test.sh android
popd

# Early completion if this is just about RN compatibility -
# in which case, running the demo project's tests is enough.
if [ "$REACT_NATIVE_COMPAT_TEST" = "true" ]; then
  exit 0
fi

pushd examples/demo-plugin
  run_f "npm run test:plugin"
popd

# Detox Native
##

pushd detox
  run_f "npm run build:android-native"
popd
