#!/bin/bash -e

nvm install stable

npm install -g lerna@2.1.2 >/dev/null 2>&1
npm install -g react-native-cli >/dev/null 2>&1
npm install -g detox-cli >/dev/null 2>&1
gem install xcpretty >/dev/null 2>&1