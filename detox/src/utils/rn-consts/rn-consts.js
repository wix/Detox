const DEFAULT_RN_VERSION = '99.9999.9999';

const rnVersion = (function parseRNVersion() {
  let raw;
  try {
    const packageJson = require('react-native/package.json');
    raw = packageJson.version;
  } catch {
    // Default version for RN
    raw = DEFAULT_RN_VERSION;
  }
  const [major, minor, patch] = raw.split('.');
  return {
    major,
    minor,
    patch,
    raw
  };
})();

const isRNNewArch = process.env.RCT_NEW_ARCH_ENABLED === '1';

module.exports = {
  rnVersion,
  isRNNewArch
};
