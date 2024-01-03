#!/bin/bash -e

echo "Node version:"
node --version

npm install -g lerna@6.5.0
npm install -g react-native-cli >/dev/null 2>&1
