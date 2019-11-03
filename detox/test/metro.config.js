let metroBundler;
try {
  metroBundler = require('metro');
} catch (ex) {
  metroBundler = require('metro-bundler');
}
module.exports = {
  resolver: {
    blacklistRE: metroBundler.createBlacklist([/detox\/node_modules\/react-native\/.*/]),
  },
};
