#!/usr/bin/env node
const _ = require("lodash");
const generateIOSAdapters = require("./adapters/ios");
const iosFiles = {
	"../detox/ios/EarlGrey/EarlGrey/Action/GREYActions.h":
		"../detox/src/ios/earlgreyapi/GREYActions.js",
	"../detox/ios/Detox/GREYMatchers+Detox.h":
		"../detox/src/ios/earlgreyapi/GREYMatchers+Detox.js",
	"../detox/ios/EarlGrey/EarlGrey/Matcher/GREYMatchers.h":
		"../detox/src/ios/earlgreyapi/GREYMatchers.js"
};

generateIOSAdapters(iosFiles);

const externalFilesToDownload = {
	"https://android.googlesource.com/platform/frameworks/testing/+/android-support-test/espresso/core/src/main/java/android/support/test/espresso/action/ViewActions.java?format=TEXT":
		"../detox/src/android/espressoapi/ViewActions.js",
	"https://android.googlesource.com/platform/frameworks/uiautomator/+/master/src/com/android/uiautomator/core/UiDevice.java?format=TEXT":
		"../detox/src/android/uiautomator/UiDevice.js"
};

const generateAndroidAdapters = require("./adapters/android");
const downloadFile = require("./utils/downloadFile");

let downloadedAndroidFilesMap = {};
_.forEach(externalFilesToDownload, function(value, key) {
	const tempFilePath = downloadFile(key);
	downloadedAndroidFilesMap[tempFilePath] = value;
});

const androidFiles = {
	...downloadedAndroidFilesMap,
	"../detox/android/detox/src/main/java/com/wix/detox/espresso/DetoxAction.java":
		"../detox/src/android/espressoapi/DetoxAction.js",
	"../detox/android/detox/src/main/java/com/wix/detox/espresso/DetoxMatcher.java":
		"../detox/src/android/espressoapi/DetoxMatcher.js"
};
generateAndroidAdapters(androidFiles);
