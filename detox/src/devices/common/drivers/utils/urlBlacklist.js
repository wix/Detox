const URL_BLACKLIST_LAUNCH_ARG = 'detoxURLBlacklistRegex';

function isRegExp(value) {
  return value instanceof RegExp;
}

function toURLBlacklistArray(value) {
  if (Array.isArray(value)) {
    return value.map(toRegexPattern);
  }

  if (isRegExp(value)) {
    return [toRegexPattern(value)];
  }

  return null;
}

function toRegexPattern(value) {
  if (isRegExp(value)) {
    return withPortableFlags(value);
  }

  if (typeof value === 'string') {
    return value;
  }

  throw new TypeError([
    'detoxURLBlacklistRegex must be a RegExp, string,',
    `or an array of RegExp/string values, got ${typeof value}`,
  ].join(' '));
}

const UNSUPPORTED_FLAGS = ['g', 'y', 'd', 'u', 'v'];

function withPortableFlags(regex) {
  const unsupported = UNSUPPORTED_FLAGS.filter(f => regex.flags.includes(f));
  if (unsupported.length > 0) {
    throw new TypeError(
      `detoxURLBlacklistRegex: flag(s) [${unsupported.join(', ')}] in /${regex.source}/${regex.flags} ` +
      `are not portable across iOS and Android — only i, m, s are supported`
    );
  }

  const flags = [
    regex.ignoreCase && 'i',
    regex.multiline && 'm',
    regex.dotAll && 's',
  ].filter(Boolean).join('');

  return flags ? `(?${flags}:${regex.source})` : regex.source;
}

function serializeURLBlacklistForIOS(value) {
  const patterns = toURLBlacklistArray(value);
  if (!patterns) {
    return value;
  }

  return JSON.stringify(patterns);
}

function serializeURLBlacklistForAndroid(value) {
  const patterns = toURLBlacklistArray(value);
  if (!patterns) {
    return value;
  }

  return JSON.stringify(patterns);
}

function normalizeURLBlacklist(value) {
  const patterns = toURLBlacklistArray(value);
  if (!patterns) {
    return value;
  }

  return patterns;
}

function isSerializedURLBlacklistForAndroid(value) {
  if (typeof value !== 'string') return false;
  const trimmed = value.trim();
  if (!trimmed.startsWith('[')) return false;
  try {
    return Array.isArray(JSON.parse(trimmed));
  } catch {
    return false;
  }
}

module.exports = {
  URL_BLACKLIST_LAUNCH_ARG,
  isSerializedURLBlacklistForAndroid,
  normalizeURLBlacklist,
  serializeURLBlacklistForAndroid,
  serializeURLBlacklistForIOS,
};
