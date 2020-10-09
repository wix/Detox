const {
  escapeInDoubleQuotedString,
  escapeInDoubleQuotedRegexp,
  escapeWithSingleQuotedString,
  escapeWithDoubleQuotedString,
  isRunningInCMDEXE,
  hasUnsafeShellChars,
  autoEscape,
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

  describe('hasUnsafeShellChars', () => {
    test.each([
      /* pin-pointer tests */
      [false, '',  'just an empty string'],
      [true, ' ',  'a whitespace character'],
      [true, '\t', 'a whitespace character'],
      [true, '\n', 'a newline character'],
      [true, '!',  'a history expansion'],
      [true, '"',  'shell syntax'],
      [true, '#',  'a comment start'],
      [true, '$',  'shell syntax'],
      [true, '&',  'shell syntax'],
      [true, `'`,  'shell syntax'],
      [true, '(',  'globs and wildcards'],
      [true, ')',  'globs and wildcards'],
      [true, '*',  'a sh wildcard'],
      [true, ';',  'shell syntax'],
      [true, '<',  'shell syntax'],
      [true, '=',  'zsh syntax'],
      [true, '>',  'shell syntax'],
      [true, '?',  'a sh wildcard'],
      [true, '[',  'a sh wildcard'],
      [true, "\\", 'shell syntax'],
      [true, ']',  'a sh wildcard'],
      [true, '^',  'a history expansion, zsh wildcard'],
      [true, '`',  'shell syntax'],
      [true, '{',  'a brace expansion start'],
      [true, ',',  'unsafe inside a brace expansion'],
      [true, '}',  'a brace expansion end'],
      [true, '|',  'shell syntax'],
      [true, '~',  'a home directory expansion'],
      [false, '-',  'almost safe, except when a filename begins with dash, it needs extra handling'],
      [false, '.',  'almost safe, except that dot files are excluded from * globs by default.'],
      [false, ':',  'almost safe, expect when it can indicate a remote file (hostname:filename)'],

      /* integration tests */
      [false, '123-abc-абв.test.js',  'just a mere test filename'],
      [true, 'some tests/my test.js',  'a filename with spaces'],
    ])('should return %j for %j because it is %s', (expected, str) => {
      expect(hasUnsafeShellChars(str)).toBe(expected);
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
      ["test string", "'test string'"],
      ["test 'this' string", `'test '"'"'this'"'"' string'`],
    ])('should transform [ %s ] to [ %s ]', (input, expected) => {
      expect(autoEscape.shell(input)).toBe(expected);
    });
  });
});
