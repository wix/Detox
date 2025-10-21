const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');

/**
 * Metro configuration
 * https://facebook.github.io/metro/docs/configuration
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = {
  resolver: {
    blockList: [/detox\/node_modules\/react-native\/.*/],
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
