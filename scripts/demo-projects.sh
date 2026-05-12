#!/usr/bin/env bash

source $(dirname "$0")/logger.sh
source $(dirname "$0")/install.sh

extract_minor_version() {
  local version="$1"
  version="${version#^}"
  version="${version#~}"
  version="${version#>=}"
  version="${version#<=}"
  version="${version#>}"
  version="${version#<}"
  echo "$version" | awk -F. '{print $2}'
}

clear_ios_pod_state_for_rn_downgrade() {
  rm -f detox/test/ios/Podfile.lock examples/demo-react-native/ios/Podfile.lock
  rm -rf detox/test/ios/Pods examples/demo-react-native/ios/Pods
}

if [ -z "$REACT_NATIVE_VERSION" ]; then
  echo "Error: REACT_NATIVE_VERSION variable was not defined!"
  exit 1
fi

current_rn_version=$(node -e "console.log(require('./detox/test/package.json').dependencies['react-native'])")
current_minor=$(extract_minor_version "${current_rn_version}")
target_minor=$(extract_minor_version "${REACT_NATIVE_VERSION}")

if [[ "${current_minor}" =~ ^[0-9]+$ ]] && [[ "${target_minor}" =~ ^[0-9]+$ ]] && [ "${current_minor}" -gt "${target_minor}" ]; then
  echo "Detected RN downgrade (${current_rn_version} -> ${REACT_NATIVE_VERSION}), clearing iOS pod state"
  clear_ios_pod_state_for_rn_downgrade
fi

if [ "$REACT_NATIVE_COMPAT_TEST" != "true" ]; then
  node scripts/change_react_native_version.js "detox" ${REACT_NATIVE_VERSION} "devDependencies"
fi

# Update the dependencies of the test project
node scripts/change_react_native_version.js "detox/test" ${REACT_NATIVE_VERSION} "dependencies"
# Only update the demo-react-native project; others will use this binary
node scripts/change_react_native_version.js "examples/demo-react-native" ${REACT_NATIVE_VERSION} "dependencies"

# Update lockfile for new RN version
run_f "yarn install --mode update-lockfile"
run_f "yarn install"
