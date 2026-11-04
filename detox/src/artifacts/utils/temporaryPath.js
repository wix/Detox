const path = require('path');

const _ = require('lodash');
const { globSync, glob: globAsync } = require('tinyglobby');

const { useForwardSlashes } = require('../../utils/shellUtils');
const tempfile = require('../../utils/tempfile');


const getRoot = _.once(() => path.dirname(tempfile()));

function createGlobber(ext) {
  const fullExt = `.detox.${ext}`;

  return {
    sync: (pattern) => {
      const cwd = getRoot();
      const files = globSync(useForwardSlashes(pattern + fullExt), { cwd });
      return files.map(f => path.join(cwd, f));
    },
    async: async (pattern) => {
      const cwd = getRoot();
      const files = await globAsync(useForwardSlashes(pattern + fullExt), { cwd });
      return files.map(f => path.join(cwd, f));
    },
  };
}

function createTempFileBuilderFn(fileExtension) {
  /**
   * @param {string} [basename]
   */
  return (basename) => {
    return basename
      ? path.join(getRoot(), `${basename}.detox.${fileExtension}`)
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
  find: {
    jsonl: createGlobber('jsonl'),
  },
};
