const path = require('path');

const tempfile = require('tempfile');

function createTempFileBuilderFn(fileExtension) {
  /**
   * @param {string} [basename]
   */
  return (basename) => {
    return basename
      ? path.join(path.dirname(tempfile()), `${basename}.detox.${fileExtension}`)
      : tempfile(`.detox.${fileExtension}`);
  };
}

module.exports = {
  for: {
    json: createTempFileBuilderFn('json'),
    jsonl: createTempFileBuilderFn('jsonl'),
    png: createTempFileBuilderFn('png'),
    log: createTempFileBuilderFn('log'),
    mp4: createTempFileBuilderFn('mp4'),
    dtxrec: createTempFileBuilderFn('dtxrec'),
    viewhierarchy: createTempFileBuilderFn('viewhierarchy'),
  },
  mask: () => path.join(tempfile(), '..') + path.sep + '*.detox.*',
};
