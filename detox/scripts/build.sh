#!/bin/bash

BABEL_ENV=test babel src -d lib
if [ "$1" != "noframework" ]; then
echo -e "\nBuilding Detox.framework"
	rm -fr Detox-ios-src.tbz
	#Prepare Earl Grey without building
	ios/EarlGrey/Scripts/setup-earlgrey.sh > /dev/null
	# xcodebuild build -project ios/Detox.xcodeproj -scheme DetoxFramework -configuration Release -derivedDataPath DetoxBuild > /dev/null
	find ./ios -name build -type d -exec rm -rf {} \; > /dev/null
	find ./ios -name Build -type d -exec rm -rf {} \; > /dev/null
	tar -cjf Detox-ios-src.tbz ios
fi

if [ "$1" == "android" -o "$2" == "android" ] ; then
	echo -e "\nBuilding Detox aars"
	rm -fr detox-oldOkhttp-debug.aar
        rm -fr detox-newOkhttp-debug.aar
        rm -fr detox-oldOkhttp-release.aar
        rm -fr detox-newOkhttp-release.aar
	cd android
	./gradlew assembleDebug
	./gradlew assembleRelease
	cd ..
	cp -fr android/detox/build/outputs/aar/detox-oldOkhttp-debug.aar .
        cp -fr android/detox/build/outputs/aar/detox-newOkhttp-debug.aar .
	cp -fr android/detox/build/outputs/aar/detox-oldOkhttp-release.aar .
        cp -fr android/detox/build/outputs/aar/detox-newOkhttp-release.aar .
fi
