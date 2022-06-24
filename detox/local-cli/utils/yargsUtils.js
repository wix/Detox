/**
 * @param {Record<string, Record<string, *>>} yargsBuilder
 * @returns {Set<string>}
 */
function extractKnownKeys(yargsBuilder) {
  return Object.entries(yargsBuilder).reduce(
    (set, [key, option]) => {
      if (option.alias) {
        if (Array.isArray(option.alias)) {
          for (const value of option.alias) {
            set.add(value);
          }
        } else {
          set.add(option.alias);
        }
      }

      return set.add(key);
    },
    new Set()
  );
}

/**
 * @param {Record<string, *>} argv
 * @param {Set<string>} booleanKeys
 * @returns {Record<string, *>}
 */
function disengageBooleanArgs(argv, booleanKeys) {
  const result = {};
  const passthrough = [];

  for (const entry of Object.entries(argv)) {
    const [key, value] = entry;
    if (key === '_' || key === '--') {
      continue;
    }

    const positiveKey = key.startsWith('no-') ? key.slice(3) : key;
    if (booleanKeys.has(positiveKey) && typeof value !== 'boolean') {
      result[positiveKey] = key === positiveKey;
      passthrough.push(value);
    } else {
      result[key] = value;
    }
  }

  return {
    ...result,
    '_': passthrough.concat(argv._),
    '--': argv['--'] || [],
  };
}

function simpleUnquote(arg) {
  if ((arg[0] === '"' || arg[0] === "'") && arg[0] === arg[arg.length - 1]) {
    return arg.slice(1, -1);
  }

  return arg;
}

module.exports = {
  disengageBooleanArgs,
  extractKnownKeys,
  simpleUnquote,
};
