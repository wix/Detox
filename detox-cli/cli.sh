#!/usr/bin/env bash

DETOX_PATH="${PWD}/node_modules/detox";
DETOX_PACKAGE_JSON_PATH="${DETOX_PATH}/package.json";

if [ -a DETOX_PACKAGE_JSON_PATH ]; then
  "${DETOX_PATH}/detox" $@
else
  echo $DETOX_PACKAGE_JSON_PATH
  "${PWD}/node_modules/.bin/detox" $@
  echo "detox is not installed in this directory"
  exit 1
fi