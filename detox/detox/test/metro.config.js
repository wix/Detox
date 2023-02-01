let createBlacklist;
try {
  // RN .64
  createBlacklist = require('metro-config/src/defaults/exclusionList');
} catch (ex) {
  try {
    createBlacklist = require('metro-config/src/defaults/blacklist');
  } catch (e) {
    createBlacklist = require('metro-bundler').createBlacklist;
  }
}

module.exports = {
  resolver: {
    blacklistRE: createBlacklist([/detox\/node_modules\/react-native\/.*/]),
  },
};
