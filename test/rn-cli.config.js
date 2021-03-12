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
