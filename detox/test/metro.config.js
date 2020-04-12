let createBlacklist;
try {
  createBlacklist = require('metro-config/src/defaults/blacklist');
} catch (ex) {
  createBlacklist = require('metro-bundler').createBlacklist;
}

module.exports = {
  resolver: {
    blacklistRE: createBlacklist([/detox\/node_modules\/react-native\/.*/]),
  },
};
