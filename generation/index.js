#!/usr/bin/env node
const generateAndroidAdapters = require('./adapters/android');
const downloadEspressoFileByClass = require('./utils/downloadEspresso');
const downloadFile = require('./utils/downloadFile');

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
// Disabled temporarily as we've switched to the androidx version of this class, which doesn't seem to exist online (not even
// on android/android-test on Github). My only hope, for now, is to be able to inquire where it is released from (maven group/name
// is androidx.test.uiautomator:uiautomator:x.y.z) either in Google i/o 2019 or on the next AMA on the /androiddev subreddit.
// Note: the 'new' (androidx) and 'old' versions are identical (except for the package name, obviously).
//  'https://android.googlesource.com/platform/frameworks/uiautomator/+/master/src/com/android/uiautomator/core/UiDevice.java?format=TEXT': '../detox/src/android/espressoapi/UIDevice.js'
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
  '../detox/android/detox/src/main/java/com/wix/detox/espresso/DetoxAssertion.java': '../detox/src/android/espressoapi/DetoxAssertion.js',
  '../detox/android/detox/src/main/java/com/wix/detox/espresso/DetoxViewActions.java': '../detox/src/android/espressoapi/DetoxViewActions.js',
  '../detox/android/detox/src/main/java/com/wix/detox/espresso/DetoxMatcher.java': '../detox/src/android/espressoapi/DetoxMatcher.js',
  '../detox/android/detox/src/main/java/com/wix/detox/Detox.java': '../detox/src/android/espressoapi/Detox.js',
  '../detox/android/detox/src/main/java/com/wix/detox/espresso/EspressoDetox.java': '../detox/src/android/espressoapi/EspressoDetox.js',
  '../detox/android/detox/src/main/java/com/wix/detox/uiautomator/UiAutomator.java': '../detox/src/android/espressoapi/UIAutomator.js'
};
generateAndroidAdapters(androidFiles);
