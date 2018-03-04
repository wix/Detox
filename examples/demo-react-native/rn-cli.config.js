const metroBundler = require('metro');

module.exports = {
  getBlacklistRE: function() {
    return metroBundler.createBlacklist([/test\/.*/]);
  }
};