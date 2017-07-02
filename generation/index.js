#!/usr/bin/env node
const generateEarlGreyBlueprints = require("./generation/earl-grey");
const files = {
  "./detox/ios/EarlGrey/EarlGrey/Action/GREYActions.h": "./demo.js"
};

generateEarlGreyBlueprints(files);
