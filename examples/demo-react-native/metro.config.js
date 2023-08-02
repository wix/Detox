const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');

/**
 * Metro configuration
 * https://facebook.github.io/metro/docs/configuration
 *
 * @type {import('metro-config').MetroConfig}
 */
const config = {};
const metroConfig = mergeConfig(getDefaultConfig(__dirname), config);



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
  ...metroConfig,
  resolver: {
    blacklistRE: createBlacklist([/test\/.*/, /detox\/node_modules\/.*/]),
  },
};
