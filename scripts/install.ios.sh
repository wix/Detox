#!/bin/bash -e

$(dirname "$0")/install.sh

gem install xcpretty >/dev/null 2>&1
#export GEM_HOME=$HOME/.gem
#export PATH=$GEM_HOME/bin:$PATH
HOMEBREW_NO_INSTALL_CLEANUP=1 HOMEBREW_NO_AUTO_UPDATE=1 brew install cocoapods

export CODE_SIGNING_REQUIRED=NO
HOMEBREW_NO_INSTALL_CLEANUP=1 HOMEBREW_NO_AUTO_UPDATE=1 brew tap wix/brew
HOMEBREW_NO_INSTALL_CLEANUP=1 HOMEBREW_NO_AUTO_UPDATE=1 brew install applesimutils
