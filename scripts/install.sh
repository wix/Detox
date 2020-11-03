#!/bin/bash -e

mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
export PATH=~/.npm-global/bin:$PATH

npm install -g lerna@3.22.1
npm install -g react-native-cli >/dev/null 2>&1
