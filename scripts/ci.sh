#!/bin/bash -e

source $(dirname "$0")/logger.sh
source $(dirname "$0")/install.sh

source $(dirname "$0")/change_all_react_native_versions.sh

run_f "lerna bootstrap --no-ci"
run_f "lerna run build"
