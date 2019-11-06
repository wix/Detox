/*
 * This has been replaced by 'metro.config.js'. It's only here to enable running with RN<60.x
 */

let metroBundler;
try {
  metroBundler = require('metro');
} catch (ex) {
  metroBundler = require('metro-bundler');
}

module.exports = {
  getBlacklistRE: function() {
    return metroBundler.createBlacklist([/detox\/node_modules\/react-native\/.*/]);
  }
};
