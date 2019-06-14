#!/bin/bash -e

"$(dirname "$0")/install.sh"

export CODE_SIGNING_REQUIRED=NO
brew tap wix/brew
brew install wix/brew/applesimutils --HEAD
