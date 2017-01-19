#!/bin/bash

BABEL_ENV=test babel src -d lib
echo -e "\nBuilding Detox.framework"
xcodebuild build -project ios/Detox.xcodeproj -scheme DetoxFramework -configuration Release -derivedDataPath DetoxBuild > /dev/null
cp -r DetoxBuild/Build/Products/Release-universal/Detox.framework .
rm -fr DetoxBuild
tar -cf Detox.framework.tar Detox.framework
