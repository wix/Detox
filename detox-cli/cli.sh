#!/usr/bin/env bash

DETOX_PATH="${PWD}/node_modules/detox";
DETOX_PACKAGE_JSON_PATH="${DETOX_PATH}/package.json";

if [ -f "${DETOX_PACKAGE_JSON_PATH}" ]; then
  "${PWD}/node_modules/.bin/detox" $@
else
  echo "${DETOX_PACKAGE_JSON_PATH}"
  echo "detox is not installed in this directory"
  exit 1
fi