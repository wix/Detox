#!/bin/bash

printf "\n#################################################################\n"

if [ -f Detox.framework.tar ]; then
  tar -xjf Detox.framework.tbz
  rm -f Detox.framework.tbz
fi

brew list fbsimctl &> /dev/null
if [ $? != 0 ]; then
  printf "\n#################################################################\n"
  brew help &> /dev/null
  if [ $? != 0 ]; then
    echo "error: Brew is not installed. Visit https://brew.sh/ for more information."
    exit 1
  fi

  brew tap facebook/fb
  if [ $? != 0 ]; then
    echo "error: Facebook Tap install failed."
    exit 1
  fi

  brew install fbsimctl --HEAD
  if [ $? != 0 ]; then
    echo "error: fbsimctl install failed."
    exit 1
  fi
else
echo "# fbsimctl already installed."
fi
