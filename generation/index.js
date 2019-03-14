#!/usr/bin/env node
const generateIOSAdapters = require('./adapters/ios');
const generateAndroidAdapters = require('./adapters/android');
const downloadEspressoFileByClass = require('./utils/downloadEspresso');
const downloadFile = require('./utils/downloadFile');

const iosFiles = {
  '../detox/ios/EarlGrey/EarlGrey/Action/GREYActions.h': '../detox/src/ios/earlgreyapi/GREYActions.js',
  '../detox/ios/Detox/GREYMatchers+Detox.h': '../detox/src/ios/earlgreyapi/GREYMatchers+Detox.js',
  '../detox/ios/EarlGrey/EarlGrey/Matcher/GREYMatchers.h': '../detox/src/ios/earlgreyapi/GREYMatchers.js',
  '../detox/ios/EarlGrey/EarlGrey/Core/GREYInteraction.h': '../detox/src/ios/earlgreyapi/GREYInteraction.js',
  '../detox/ios/Detox/GREYCondition+Detox.h': '../detox/src/ios/earlgreyapi/GREYConditionDetox.js',
  '../detox/ios/EarlGrey/EarlGrey/Synchronization/GREYCondition.h': '../detox/src/ios/earlgreyapi/GREYCondition.js',
  '../detox/ios/Detox/GREYConfiguration+Detox.h': '../detox/src/ios/earlgreyapi/GREYConfigurationDetox.js',
  '../detox/ios/EarlGrey/EarlGrey/Common/GREYConfiguration.h': '../detox/src/ios/earlgreyapi/GREYConfiguration.js',
  '../detox/ios/EarlGrey/EarlGrey/Core/EarlGreyImpl.h': '../detox/src/ios/earlgreyapi/EarlGreyImpl.js',
  '../detox/ios/Detox/GREYActions+Detox.h': '../detox/src/ios/earlgreyapi/GREYActions+Detox.js'
};
generateIOSAdapters(iosFiles);

const espressoFilesToDownload = {
  'androidx.test.espresso.action.ViewActions': '../detox/src/android/espressoapi/ViewActions.js'
};

const downloadedEspressoFilesMap = Object
  .entries(espressoFilesToDownload)
  .reduce(function (obj, [fullyQualifiedClass, dest]) {
      obj[downloadEspressoFileByClass(fullyQualifiedClass)] = dest;
      return obj;
    }, {}
  );

const externalFilesToDownload = {
  // This doesn't work on ios builds on CI - I suspect a node version issue since the root of the problem is in child_process'
  // execFileSync() (probably incompatible parameters usage).
  // FIX ASAP

  // 'https://android.googlesource.com/platform/frameworks/uiautomator/+/master/src/com/android/uiautomator/core/UiDevice.java?format=TEXT':
  //   '../detox/src/android/espressoapi/UIDevice.js'
};

const downloadedAndroidFilesMap = Object
  .entries(externalFilesToDownload)
  .reduce(function (obj, [url, dest]) {
    obj[downloadFile(url, 'base64')] = dest;
    return obj;
  }, {}
);

const androidFiles = {
  ...downloadedAndroidFilesMap,
  ...downloadedEspressoFilesMap,
  '../detox/android/detox/src/main/java/com/wix/detox/espresso/DetoxAction.java': '../detox/src/android/espressoapi/DetoxAction.js',
  '../detox/android/detox/src/main/java/com/wix/detox/espresso/DetoxViewActions.java':
    '../detox/src/android/espressoapi/DetoxViewActions.js',
  '../detox/android/detox/src/main/java/com/wix/detox/espresso/DetoxMatcher.java': '../detox/src/android/espressoapi/DetoxMatcher.js',
  '../detox/android/detox/src/main/java/com/wix/detox/Detox.java': '../detox/src/android/espressoapi/Detox.js',
  '../detox/android/detox/src/main/java/com/wix/detox/espresso/EspressoDetox.java': '../detox/src/android/espressoapi/EspressoDetox.js',
  '../detox/android/detox/src/main/java/com/wix/detox/uiautomator/UiAutomator.java': '../detox/src/android/espressoapi/UIAutomator.js'
};
generateAndroidAdapters(androidFiles);
