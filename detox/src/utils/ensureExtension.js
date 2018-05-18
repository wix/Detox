const path = require('path');

function ensureExtension(filename, ext) {
  return path.extname(filename) === ext
    ? filename
    : filename + ext;
}

module.exports = ensureExtension;

