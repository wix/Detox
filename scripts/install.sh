#!/bin/bash -e

echo "Node version:"
node --version

corepack enable
echo "Yarn version: $(yarn --version)"

if [ ! -z ${REACT_NATIVE_VERSION} ]; then
  DETOX_DISABLE_POD_INSTALL=true yarn install --immutable
else
  yarn install --immutable
fi
