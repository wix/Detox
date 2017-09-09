const blacklist = require('react-native/packager/blacklist');

module.exports = {
  getBlacklistRE: () => blacklist([
    /test\/.*/,
  ]),
};