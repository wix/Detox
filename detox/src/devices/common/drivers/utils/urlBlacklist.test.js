const {
  serializeURLBlacklistForAndroid,
  serializeURLBlacklistForIOS,
  isSerializedURLBlacklistForAndroid,
  normalizeURLBlacklist,
} = require('./urlBlacklist');

describe('URL blacklist launch-arg serialization', () => {
  const blacklist = [
    /https:\/\/x\.com\/a(?:b|c)\/{1,3}/,
    /^https:\/\/x\.com\/foo bar$/,
    /^https:\/\/x\.com\/"quoted"$/,
    /foo\s+bar/ims,
  ];

  const expectedPatterns = [
    'https:\\/\\/x\\.com\\/a(?:b|c)\\/{1,3}',
    '^https:\\/\\/x\\.com\\/foo bar$',
    '^https:\\/\\/x\\.com\\/"quoted"$',
    '(?ims:foo\\s+bar)',
  ];

  it('serializes RegExp arrays to an iOS JSON array string', () => {
    expect(serializeURLBlacklistForIOS(blacklist)).toBe(JSON.stringify(expectedPatterns));
  });

  it('serializes RegExp arrays to an Android JSON array string', () => {
    expect(serializeURLBlacklistForAndroid(blacklist)).toBe(JSON.stringify(expectedPatterns));
  });

  it('also accepts string arrays for callers that cannot use RegExp objects', () => {
    const stringBlacklist = [
      'https://x.com/a(?:b|c)/{1,3}',
      '^https://x.com/foo bar$',
    ];

    expect(serializeURLBlacklistForIOS(stringBlacklist)).toBe(JSON.stringify(stringBlacklist));
    expect(serializeURLBlacklistForAndroid(stringBlacklist)).toBe(JSON.stringify(stringBlacklist));
  });

  it('leaves legacy string values untouched', () => {
    const legacyValue = '(".*frog.wix.com/.*")';

    expect(serializeURLBlacklistForIOS(legacyValue)).toBe(legacyValue);
    expect(serializeURLBlacklistForAndroid(legacyValue)).toBe(legacyValue);
  });

  it('does not misidentify a legacy plain-string regex starting with [ as a serialized array', () => {
    expect(isSerializedURLBlacklistForAndroid('[a-z]+.*')).toBe(false);
    expect(isSerializedURLBlacklistForAndroid('[invalid json')).toBe(false);
    expect(isSerializedURLBlacklistForAndroid('["valid","json"]')).toBe(true);
  });

  it('throws for RegExp flags that are not portable across iOS and Android', () => {
    expect(() => serializeURLBlacklistForAndroid([/pattern/u])).toThrow(/not portable/);
    expect(() => serializeURLBlacklistForIOS([/pattern/g])).toThrow(/not portable/);
  });

  describe('normalizeURLBlacklist (runtime setURLBlacklist)', () => {
    it('converts a RegExp array to a plain pattern-string array', () => {
      expect(normalizeURLBlacklist(blacklist)).toEqual(expectedPatterns);
    });

    it('leaves a plain string array untouched', () => {
      const stringBlacklist = ['.*127.0.0.1.*', '.*my.ignored.endpoint.*'];
      expect(normalizeURLBlacklist(stringBlacklist)).toEqual(stringBlacklist);
    });

    it('passes non-array values (e.g. undefined) through unchanged', () => {
      expect(normalizeURLBlacklist(undefined)).toBeUndefined();
    });

    it('throws for non-portable RegExp flags', () => {
      expect(() => normalizeURLBlacklist([/pattern/g])).toThrow(/not portable/);
    });
  });
});
