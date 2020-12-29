const { quote, parse } = require('./shellQuote');

describe('shellQuote', () => {
  describe('.quote(argv)', () => {
    it('should not escape safe characters', () => {
      expect(quote(['-w', '3'])).toBe('-w 3');
    });

    it('should escape unsafe characters', () => {
      expect(quote([
        '--detoxURLBlacklistRegex',
        `("^http://192.168.1.253:19001/onchange$")`
      ])).toBe(`--detoxURLBlacklistRegex '("^http://192.168.1.253:19001/onchange$")'`);
    });
  });

  describe('.parse(str)', () => {
    it('should parse command line calls', () => {
      expect(parse('-w 3')).toEqual(['-w', '3']);
    });

    it('should parse command line calls with globs', () => {
      expect(parse('--include **/*.test.js')).toEqual(['--include', '**/*.test.js']);
    });

    it('should not be able to parse operators', () => {
      expect(parse('dog || cat')).toEqual(['dog', 'cat']);
    });
  });
});
