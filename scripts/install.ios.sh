#!/bin/bash -e

./scripts/install.sh

export CODE_SIGNING_REQUIRED=NO
brew tap wix/brew
brew install applesimutils --HEAD