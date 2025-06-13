const tmp = require('tmp');

tmp.setGracefulCleanup();

/**
 * Creates a temporary file path. If extension is provided, it will be appended to the path.
 * @param {string} [extension] - Optional file extension to append to the temporary file path
 * @returns {string} Path to a temporary file
 */
module.exports = function(extension) {
  const _extension = (extension && extension.startsWith('.'))
    ? extension
    : (extension && `.${extension}`);

  return tmp.tmpNameSync({
    template: `detox-${process.pid}-XXXXXX${_extension || ''}`,
  });
};
