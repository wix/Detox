#!/bin/bash -e

# Detox package runs a postinstall script when installed as a dependency in order to compile Detox.framework (iOS).
# In order to install it, the framework sources must be already packaged in Detox-ios-src.tbz. An issue arises when developing Detox,
# since postinstall runs before prepublish, causing the compilation script to start running before the sources are available,
# so we had to add a hack :( to the dev process, skipping postinstall and then manually triggering it.
__DETOX_DEV=true lerna bootstrap
npm run postinstall --prefix detox
