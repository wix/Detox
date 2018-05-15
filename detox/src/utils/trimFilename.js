const DetoxRuntimeError = require('../errors/DetoxRuntimeError');
const MAX_FILE_LENGTH = 255;

/*
  Trim filename to match filesystem limits (usually, not longer than 255 chars)
 */
function trimFilename(prefix = '', trimmable = '', suffix = '') {
  const nonTrimmableLength = prefix.length + suffix.length;

  if (nonTrimmableLength.length >= MAX_FILE_LENGTH) {
    throw new DetoxRuntimeError({
      message: `cannot trim filename to match filesystem limits because prefix and/or suffix are exceed ${MAX_FILE_LENGTH} chars limit`,
      debugInfo: `prefix = ${JSON.stringify(prefix)} (${prefix.length} chars), suffix = ${JSON.stringify(suffix)} (${suffix.length}chars)`,
    });
  }

  const trimmed = trimmable.slice(-MAX_FILE_LENGTH + nonTrimmableLength);
  return prefix + trimmed + suffix;
}

module.exports = trimFilename;
