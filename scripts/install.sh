#!/bin/bash -e

echo "Node version:"
node --version

npm install -g lerna@3.22.1
npm install -g react-native-cli >/dev/null 2>&1
