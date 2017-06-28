#!/bin/bash

BABEL_ENV=test babel src -d lib
if [ "$1" != "noframework" ]; then
echo -e "\nBuilding Detox.framework"
	rm -fr Detox.framework
	xcodebuild build -project ios/Detox.xcodeproj -scheme DetoxFramework -configuration Release -derivedDataPath DetoxBuild > /dev/null
	cp -fr DetoxBuild/Build/Products/Release-universal/Detox.framework .
	rm -fr DetoxBuild
	tar -cjf Detox.framework.tbz Detox.framework
fi

if [ "$1" == "android" -o "$2" == "android" ] ; then
	echo -e "\nBuilding Detox aars"
	rm -fr detox-debug.aar
	rm -fr detox-release.aar
	cd android
	./gradlew assembleDebug
	./gradlew assembleRelease
	cd ..
	cp -fr android/detox/build/outputs/aar/detox-debug.aar .
	cp -fr android/detox/build/outputs/aar/detox-release.aar .
fi
