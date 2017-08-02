#!/usr/bin/env node
const generateEarlGreyAdapters = require("./earl-grey");
const files = {
  "../detox/ios/EarlGrey/EarlGrey/Action/GREYActions.h": "../detox/src/ios/EarlGrey/GreyActions.js"
};

generateEarlGreyAdapters(files);
