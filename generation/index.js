#!/usr/bin/env node
const generateEarlGreyBlueprints = require("./earl-grey");
const files = {
  "../detox/ios/EarlGrey/EarlGrey/Action/GREYActions.h": "./demo.js"
};

generateEarlGreyBlueprints(files);
