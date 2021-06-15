const {
  autoEscape,
  escapeInDoubleQuotedRegexp,
  escapeInDoubleQuotedString,
  escapeWithDoubleQuotedString,
  escapeWithSingleQuotedString,
  hasUnsafeChars,
  isRunningInCMDEXE,
} = require('./shellUtils');

describe('shellUtils', function() {
  describe('escapeInDoubleQuotedString', () => {
    test.each([
      ['test string', 'test string'],
      ['"test string"', `\\"test string\\"`],
    ])('should transform [ %s ] to [ %s ]', (input, expected) => {
      expect(escapeInDoubleQuotedString(input)).toBe(expected);
    });
  });

  describe('escapeInDoubleQuotedRegexp', () => {
    test.each([
      ['test string', 'test string'],
      ['^tes\\t[ ]*.string$', '\\^tes\\\\t\\[ \\]\\*\\.string\\$'],
    ])('should transform [ %s ] to [ %s ]', (input, expected) => {
      expect(escapeInDoubleQuotedRegexp(input)).toBe(expected);
    });
  });

  describe('escapeWithSingleQuotedString', () => {
    test.each([
      ['test string', `'test string'`],
      ["d'Artagnan", `'d'"'"'Artagnan'`],
    ])('should transform [ %s ] to [ %s ]', (input, expected) => {
      expect(escapeWithSingleQuotedString(input)).toBe(expected);
    });
  });

  describe('escapeWithDoubleQuotedString', () => {
    test.each([
      ['test string', '"test string"'],
      ['"test string"', `"\\"test string\\""`],
    ])('should transform [ %s ] to [ %s ]', (input, expected) => {
      expect(escapeWithDoubleQuotedString(input)).toBe(expected);
    });
  });

  describe('isRunningInCMDEXE', () => {
    test('should return a boolean value', () => {
      expect(typeof isRunningInCMDEXE()).toBe('boolean');
    });
  });

  describe('hasUnsafeChars', () => {
    const CASES = [
    /* cmd    shell  input comment */
      /* pin-pointer tests */
      [false, false, '',   'just an empty string'],
      [true,  true,  ' ',  'a whitespace character'],
      [true,  true,  '\t', 'a whitespace character'],
      [true,  true,  '\n', 'a newline character'],
      [true,  true,  '!',  'a history expansion'],
      [true,  true,  '"',  'shell syntax'],
      [true,  true,  '#',  'a comment start'],
      [true,  true,  '$',  'shell syntax'],
      [true,  true,  '&',  'shell syntax'],
      [true,  true,  `'`,  'shell syntax'],
      [true,  true,  '(',  'globs and wildcards'],
      [true,  true,  ')',  'globs and wildcards'],
      [true,  true,  '*',  'a sh wildcard'],
      [true,  true,  ';',  'shell syntax'],
      [true,  true,  '<',  'shell syntax'],
      [true,  true,  '=',  'zsh syntax'],
      [true,  true,  '>',  'shell syntax'],
      [true,  true,  '?',  'a sh wildcard'],
      [true,  true,  '[',  'a sh wildcard'],
      [false, true,  '\\', 'shell syntax'],
      [true,  true,  ']',  'a sh wildcard'],
      [true,  true,  '^',  'a history expansion, zsh wildcard'],
      [true,  true,  '`',  'shell syntax'],
      [true,  true,  '{',  'a brace expansion start'],
      [true,  true,  ',',  'unsafe inside a brace expansion'],
      [true,  true,  '}',  'a brace expansion end'],
      [true,  true,  '|',  'shell syntax'],
      [true,  true,  '~',  'a home directory expansion'],
      [false, false, '-', 'almost safe, except when a filename begins with dash, it needs extra handling'],
      [false, false, '.', 'almost safe, except that dot files are excluded from * globs by default.'],
      [false, false, ':', 'almost safe, expect when it can indicate a remote file (hostname:filename)'],
      /* integration tests */
      [false, false, '123-abc-абв.test.js',  'just a mere test filename'],
      [true, true, 'some tests/my test.js',  'a filename with spaces'],
    ];

    describe('.cmd', () => {
      const CMD_CASES = CASES.map(([expected, _shell, input, comment]) => [expected, input, comment]);

      test.each(CMD_CASES)('should return %j for %j because it is %s', (expected, str, __) => {
        expect(hasUnsafeChars.cmd(str)).toBe(expected);
      });
    });

    describe('.shell', () => {
      const SHELL_CASES = CASES.map(([_cmd, expected, input, comment]) => [expected, input, comment]);

      test.each(SHELL_CASES)('should return %j for %j because it is %s', (expected, str, __) => {
        expect(hasUnsafeChars.shell(str)).toBe(expected);
      });
    });
  });

  describe('autoEscape.cmd', () => {
    test.each([
      ['test', 'test'],
      ['test string', '"test string"'],
      ['test "this" string', '"test \\"this\\" string"'],
    ])('should transform [ %s ] to [ %s ]', (input, expected) => {
      expect(autoEscape.cmd(input)).toBe(expected);
    });
  });

  describe('autoEscape.shell', () => {
    test.each([
      ['test', 'test'],
      ['test string', "'test string'"],
      ["test 'this' string", `'test '"'"'this'"'"' string'`],
    ])('should transform [ %s ] to [ %s ]', (input, expected) => {
      expect(autoEscape.shell(input)).toBe(expected);
    });
  });
});
