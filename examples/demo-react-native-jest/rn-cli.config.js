const metroBundler = require('metro-bundler');

module.exports = {
  getBlacklistRE: function() {
    return metroBundler.createBlacklist([/test\/.*/]);
  }
};