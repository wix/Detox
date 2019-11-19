let metroBundler;
try {
  metroBundler = require('metro');
} catch (ex) {
  metroBundler = require('metro-bundler');
}
module.exports = {
  resolver: {
    blacklistRE: metroBundler.createBlacklist([/test\/.*/, /detox\/node_modules\/.*/]),
  },
};
