#!/bin/bash -e

SCRIPTPATH="$( cd "$(dirname "$0")" >/dev/null 2>&1 ; pwd -P )"

XCODEVERSION=$(xcodebuild -version | grep -oEi "([0-9]*(\.[0-9]*)+)")
if [ "${XCODEVERSION}" == "`echo -e "${XCODEVERSION}\n12.0" | sort --version-sort -r | head -n1`" ]; then
  echo "Xcode 12 and above; using modern script for building the framework to support Apple Silicon"
  FRAMEWORK_SCRIPT="build_universal_framework_modern.sh"
else
  echo "Xcode 11 and below; using legacy script for building"
  FRAMEWORK_SCRIPT="build_universal_framework_legacy.sh"
fi

"${SCRIPTPATH}/${FRAMEWORK_SCRIPT}" "$@"