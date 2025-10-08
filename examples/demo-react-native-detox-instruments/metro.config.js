const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');

/**
 * Metro configuration
 * https://facebook.github.io/metro/docs/configuration
 */
const config = {
  resolver: {
    blockList: [/test\/.*/, /detox\/node_modules\/.*/],
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
