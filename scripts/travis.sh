#!/bin/bash

set -e

cd ../detox/detox

npm install -g react-native-cli

npm install
npm run build > /dev/null
npm run test-clean
npm run test-install
npm run test