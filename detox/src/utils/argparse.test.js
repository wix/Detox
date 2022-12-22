jest.unmock('process');

describe('argparse', () => {
  describe('getEnvValue()', () => {
    let _env;
    let argparse;

    beforeEach(() => {
      _env = process.env;

      process.env = {
        ..._env,
        DETOX_FOO_BAR: 'value',
      };

      argparse = require('./argparse');
    });

    afterEach(() => {
      process.env = _env;
    });

    it(`nonexistent key should return undefined`, () => {
      expect(argparse.getEnvValue('blah')).not.toBeDefined();
    });

    it(`existing DETOX_SNAKE_FORMAT key should return its value (kebab-case input)`, () => {
      expect(argparse.getEnvValue('foo-bar')).toBe('value');
    });

    it(`existing DETOX_SNAKE_FORMAT key should return its value (camelCase input)`, () => {
      expect(argparse.getEnvValue('fooBar')).toBe('value');
    });

    it('should return undefined if process.env contain something with a string of undefined' ,() => {
      process.env.DETOX_FOO_BAR = 'undefined';
      expect(argparse.getEnvValue('fooBar')).toBe(undefined);
    });
  });

  describe('joinArgs()', () => {
    let argparse;

    beforeEach(() => {
      argparse = require('./argparse');
    });

    it('should convert key-values to args string', () => {
      expect(argparse.joinArgs({
        optional: undefined,
        debug: true,
        timeout: 3000,
        logLevel: 'verbose',
        '-w': 1,
        'device-name': 'iPhone X'
      })).toBe('--debug --timeout 3000 --logLevel verbose -w 1 --device-name "iPhone X"');
    });

    it('should accept options', () => {
      const options = { prefix: '-', joiner: '=' };
      const argsObject = {
        'version': 100,
        '--help': true
      };

      expect(argparse.joinArgs(argsObject, options)).toBe('-version=100 --help');
    });
  });

  describe('getCurrentCommand()', () => {
    let argparse;

    beforeEach(() => {
      argparse = require('./argparse');
    });

    it('should return the current command in relative path format', () => {
      expect(argparse.getCurrentCommand()).toMatch(/^[^\\/]\S*jest.*$/);
      expect(argparse.getCurrentCommand()).toContain(process.argv.slice(2).join(' '));
    });

    it('should return the rest of the command as-is', () => {
      process.argv.push(__dirname);
      try {
        expect(argparse.getCurrentCommand()).toContain(__dirname);
      } finally {
        process.argv.pop();
      }
    });
  });
});
