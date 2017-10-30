#!/bin/bash -e

if [ "$__DETOX_DEV" = true ]; then
  echo "Running postinstall for detox dev mode, exiting"
  exit 0
fi

if [ `uname` == "Darwin" ]; then
  source "$(dirname ${0})/build_framework.ios.sh"
fi
