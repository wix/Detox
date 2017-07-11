#!/usr/bin/env node
const generateEarlGreyBlueprints = require("./earl-grey");
const files = {
  "../detox/ios/EarlGrey/EarlGrey/Action/GREYActions.h": "../detox/src/ios/EarlGrey/GreyActions.js"
};

generateEarlGreyBlueprints(files);
