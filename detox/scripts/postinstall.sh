#!/bin/bash -e

if [ `uname` == "Darwin" ]; then
  source "$(dirname ${0})/build_framework.ios.sh"
fi
