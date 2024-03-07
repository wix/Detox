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

const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');

/**
 * Metro configuration
 * https://facebook.github.io/metro/docs/configuration
 *
 * @type {import('metro-config').MetroConfig}
 */
const config = {};
const baseConfig = mergeConfig(getDefaultConfig(__dirname), config);



module.exports = {
  ...baseConfig,
  resolver: {
    blacklistRE: createBlacklist([/detox\/node_modules\/react-native\/.*/]),
  },
};
