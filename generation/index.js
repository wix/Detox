#!/usr/bin/env node
const generateEarlGreyAdapters = require("./earl-grey");
const files = {
  "../detox/ios/EarlGrey/EarlGrey/Action/GREYActions.h": "../detox/src/ios/earlgreyapi/GREYActions.js",
  "../detox/ios/Detox/GREYMatchers+Detox.h": "../detox/src/ios/earlgreyapi/GREYMatchers+Detox.js",
  "../detox/ios/EarlGrey/EarlGrey/Matcher/GREYMatchers.h": "../detox/src/ios/earlgreyapi/GREYMatchers.js",
};

generateEarlGreyAdapters(files);
