#!/bin/bash -ex

#curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.33.1/install.sh | bash
export NVM_DIR="$HOME/.nvm" && [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
nvm install stable

npm install -g lerna@2.1.2 >/dev/null 2>&1
npm install -g react-native-cli >/dev/null 2>&1
npm install -g detox-cli >/dev/null 2>&1
gem install xcpretty >/dev/null 2>&1