#!/bin/bash -e

$(dirname "$0")/install.sh

export CODE_SIGNING_REQUIRED=NO
brew tap wix/brew
brew install applesimutils --HEAD