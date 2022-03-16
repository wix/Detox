#!/usr/bin/env node
const generateAndroidAdapters = require('./adapters/android');
const downloadEspressoFileByClass = require('./utils/downloadEspresso');
const downloadFile = require('./utils/downloadFile');

const espressoFilesToDownload = {
  'androidx.test.espresso.action.ViewActions': '../detox/src/android/espressoapi/ViewActions.js'
};

const externalFilesToDownload = {
  // TODO replace this with the non-deprecated version of UiDevice (i.e. released as uiautomator under androidx).
  // This is pending because the new code doesn't seem to exist online (not even on android/android-test on Github).
  // Note: for now, it appears that the 'new' (androidx) and 'old' versions are identical (except for the package name, obviously).

  // Disabled so as to avoid having to download this each time while there are no code changes...
  // 'https://android.googlesource.com/platform/frameworks/uiautomator/+/master/src/com/android/uiautomator/core/UiDevice.java?format=TEXT': '../detox/src/android/espressoapi/UIDevice.js'
};

function createAndroidFiles() {
  const downloadedEspressoFilesMap =
    Object
      .entries(espressoFilesToDownload)
      .reduce(function (obj, [fullyQualifiedClass, dest]) {
          obj[downloadEspressoFileByClass(fullyQualifiedClass)] = dest;
          return obj;
        }, {}
      );

  const downloadedAndroidFilesMap =
    Object
      .entries(externalFilesToDownload)
      .reduce(function (obj, [url, dest]) {
          obj[downloadFile(url, 'base64')] = dest;
          return obj;
        }, {}
      );

  return {
    ...downloadedAndroidFilesMap,
    ...downloadedEspressoFilesMap,
    '../detox/android/detox/src/full/java/com/wix/detox/espresso/DetoxAction.java': '../detox/src/android/espressoapi/DetoxAction.js',
    '../detox/android/detox/src/full/java/com/wix/detox/espresso/DetoxAssertion.java': '../detox/src/android/espressoapi/DetoxAssertion.js',
    '../detox/android/detox/src/full/java/com/wix/detox/espresso/DetoxViewActions.java': '../detox/src/android/espressoapi/DetoxViewActions.js',
    '../detox/android/detox/src/full/java/com/wix/detox/espresso/DetoxMatcher.java': '../detox/src/android/espressoapi/DetoxMatcher.js',
    '../detox/android/detox/src/full/java/com/wix/detox/Detox.java': '../detox/src/android/espressoapi/Detox.js',
    '../detox/android/detox/src/full/java/com/wix/detox/espresso/EspressoDetox.java': '../detox/src/android/espressoapi/EspressoDetox.js',
    '../detox/android/detox/src/full/java/com/wix/detox/uiautomator/UiAutomator.java': '../detox/src/android/espressoapi/UIAutomator.js',
    '../detox/android/detox/src/full/java/com/wix/detox/espresso/web/EspressoWebDetox.java': '../detox/src/android/espressoapi/web/EspressoWebDetox.js',
    '../detox/android/detox/src/full/java/com/wix/detox/espresso/web/DetoxWebAtomMatcher.java': '../detox/src/android/espressoapi/web/DetoxWebAtomMatcher.js',
    '../detox/android/detox/src/full/java/com/wix/detox/espresso/web/WebViewElement.java': '../detox/src/android/espressoapi/web/WebViewElement.js',
    '../detox/android/detox/src/full/java/com/wix/detox/espresso/web/WebElement.java': '../detox/src/android/espressoapi/web/WebElement.js',
    '../detox/android/detox/src/full/java/com/wix/detox/espresso/web/WebExpect.java': '../detox/src/android/espressoapi/web/WebExpect.js',
    '../detox/android/detox/src/full/java/com/wix/detox/genymotion/DetoxGenymotionManager.java': '../detox/src/android/espressoapi/DetoxGenymotionManager.js'
  };
}

generateAndroidAdapters(createAndroidFiles());
