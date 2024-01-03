#!/bin/bash -e

echo "Node version:"
node --version

npm install -g lerna@6.6.2
npm install -g react-native-cli >/dev/null 2>&1
