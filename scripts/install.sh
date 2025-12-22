#!/bin/bash -e

echo "Node version:"
node --version

corepack enable
echo "Yarn version: $(yarn --version)"

yarn install --immutable
