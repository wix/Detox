#!/usr/bin/env node
const generateIOSAdapters = require("./adapters/ios");
const iosFiles = {
  "../detox/ios/EarlGrey/EarlGrey/Action/GREYActions.h": "../detox/src/ios/earlgreyapi/GREYActions.js",
  "../detox/ios/Detox/GREYMatchers+Detox.h": "../detox/src/ios/earlgreyapi/GREYMatchers+Detox.js",
  "../detox/ios/EarlGrey/EarlGrey/Matcher/GREYMatchers.h": "../detox/src/ios/earlgreyapi/GREYMatchers.js",
};

generateIOSAdapters(iosFiles);

const generateAndroidAdapters = require("./adapters/android");
const androidFiles = {
  "../detox/android/detox/src/main/java/com/wix/detox/espresso/DetoxAction.java": "../detox/src/android/espressoapi/DetoxAction.js"
};
generateAndroidAdapters(androidFiles); 