const path = require('node:path');
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

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
    ...baseConfig.resolver,

    nodeModulesPaths: [
      path.resolve('node_modules'),
      path.resolve('../node_modules'),
      path.resolve('../../node_modules'),
    ],
  },
  watchFolders: [
    path.resolve('..'),
  ]
};
