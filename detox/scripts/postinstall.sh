#!/bin/bash

if [ `uname` == "Darwin" ]; then
  source "$(dirname ${0})/postinstall.ios.sh"
fi
