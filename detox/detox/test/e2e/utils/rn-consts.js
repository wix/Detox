const rnVersion = (function parseRNVersion() {
  const packageJson = require('react-native/package.json');
  const raw = packageJson.version;
  const [major, minor, patch] = raw.split('.');
  return {
    major,
    minor,
    patch,
    raw,
  };
})();

module.exports = {
  rnVersion,
};
