#!/bin/bash

BABEL_ENV=test babel src -d lib
if [ "$1" != "noframework" ]; then
echo -e "\nBuilding Detox.framework"
	xcodebuild build -project ios/Detox.xcodeproj -scheme DetoxFramework -configuration Release -derivedDataPath DetoxBuild > /dev/null
	cp -r DetoxBuild/Build/Products/Release-universal/Detox.framework .
	rm -fr DetoxBuild
	tar -cjf Detox.framework.tbz Detox.framework
fi