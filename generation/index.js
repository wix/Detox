#!/usr/bin/env node

const generateIOSAdapters = require('./adapters/ios');
const generateAndroidAdapters = require('./adapters/android');

const iosFiles = {
  '../detox/ios/EarlGrey/EarlGrey/Action/GREYActions.h': '../detox/src/ios/earlgreyapi/GREYActions.js',
  '../detox/ios/Detox/GREYMatchers+Detox.h': '../detox/src/ios/earlgreyapi/GREYMatchers+Detox.js',
  '../detox/ios/EarlGrey/EarlGrey/Matcher/GREYMatchers.h': '../detox/src/ios/earlgreyapi/GREYMatchers.js',
  '../detox/ios/EarlGrey/EarlGrey/Core/GREYInteraction.h': '../detox/src/ios/earlgreyapi/GREYInteraction.js',
  '../detox/ios/Detox/GREYCondition+Detox.h': '../detox/src/ios/earlgreyapi/GREYConditionDetox.js',
  '../detox/ios/EarlGrey/EarlGrey/Synchronization/GREYCondition.h': '../detox/src/ios/earlgreyapi/GREYCondition.js',
  '../detox/ios/Detox/GREYConfiguration+Detox.h': '../detox/src/ios/earlgreyapi/GREYConfigurationDetox.js',
  '../detox/ios/EarlGrey/EarlGrey/Common/GREYConfiguration.h': '../detox/src/ios/earlgreyapi/GREYConfiguration.js',
  '../detox/ios/EarlGrey/EarlGrey/Core/EarlGreyImpl.h': '../detox/src/ios/earlgreyapi/EarlGreyImpl.js'
};
generateIOSAdapters(iosFiles);

const androidFiles = {
  '../android-uiautomator/src/com/android/uiautomator/core/UiDevice.java': '../detox/src/android/espressoapi/UIDevice.js',
  '../android-testing/espresso/core/src/main/java/android/support/test/espresso/action/ViewActions.java':
    '../detox/src/android/espressoapi/ViewActions.js',
  '../detox/android/detox/src/main/java/com/wix/detox/espresso/DetoxAction.java': '../detox/src/android/espressoapi/DetoxAction.js',
  '../detox/android/detox/src/main/java/com/wix/detox/espresso/DetoxMatcher.java': '../detox/src/android/espressoapi/DetoxMatcher.js',
  '../detox/android/detox/src/main/java/com/wix/detox/Detox.java': '../detox/src/android/espressoapi/Detox.js',
  '../detox/android/detox/src/main/java/com/wix/detox/espresso/EspressoDetox.java': '../detox/src/android/espressoapi/EspressoDetox.js',
  '../detox/android/detox/src/main/java/com/wix/detox/uiautomator/UiAutomator.java': '../detox/src/android/espressoapi/UIAutomator.js',
  '../detox/android/detox/src/main/java/com/wix/detox/espresso/DetoxViewActions.java':
    '../detox/src/android/espressoapi/DetoxViewActions.js'
};
generateAndroidAdapters(androidFiles);
