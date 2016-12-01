#!/bin/bash

BABEL_ENV=test babel src -d lib
xcodebuild clean build -project ios/Detox.xcodeproj -scheme DetoxFramework -configuration Release -derivedDataPath DetoxBuild
cp -r DetoxBuild/Build/Products/Release-universal/Detox.framework .
rm -fr DetoxBuild
tar -cf Detox.framework.tar Detox.framework
rm -fr Detox.framework
