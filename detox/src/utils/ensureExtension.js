const path = require('path');

function ensureExtension(filename, ext) {
  return !ext || path.extname(filename) === ext
    ? filename
    : filename + ext;
}

module.exports = ensureExtension;

