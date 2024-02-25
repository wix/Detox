let createBlacklist;
try {
  // RN .64
  createBlacklist = require('metro-config/src/defaults/exclusionList');
} catch (ex) {
  try {
    createBlacklist = require('metro-config/src/defaults/blacklist');
  } catch (ex) {
    createBlacklist = require('metro-bundler').createBlacklist;
  }
}

module.exports = {
  resolver: {
    blacklistRE: createBlacklist([/test\/.*/, /detox\/node_modules\/.*/]),
  },
};
