jest.unmock('process');

describe('argparse', () => {
  let minimist;

  beforeEach(() => {
    jest.mock('minimist');
    minimist = require('minimist');
  });

  describe('getArgValue()', () => {
    describe('using env variables', () => {
      let _env;
      let argparse;

      beforeEach(() => {
        _env = process.env;

        process.env = {
          ..._env,
          DETOX_FOO_BAR: 'value',
        };

        minimist.mockReturnValue(undefined);
        argparse = require('./argparse');
      });

      afterEach(() => {
        process.env = _env;
      });

      it(`nonexistent key should return undefined`, () => {
        expect(argparse.getArgValue('blah')).not.toBeDefined();
      });

      it(`existing DETOX_SNAKE_FORMAT key should return its value (kebab-case input)`, () => {
        expect(argparse.getArgValue('foo-bar')).toBe('value');
      });

      it(`existing DETOX_SNAKE_FORMAT key should return its value (camelCase input)`, () => {
        expect(argparse.getArgValue('fooBar')).toBe('value');
      });

      it('should return undefined if process.env contain something with a string of undefined' ,() => {
        process.env.DETOX_FOO_BAR = 'undefined';
        expect(argparse.getArgValue('fooBar')).toBe(undefined);
      });
    });

    describe('using arguments', () => {
      let argparse;

      beforeEach(() => {
        minimist.mockReturnValue({ 'kebab-case-key': 'a value', 'b': 'shortened' });
        argparse = require('./argparse');
      });

      it(`nonexistent key should return undefined result`, () => {
        expect(argparse.getArgValue('blah')).not.toBeDefined();
      });

      it(`alias alternative should fiind the result`, () => {
        expect(argparse.getArgValue('blah', 'b')).toBe('shortened');
      });

      it(`existing key should return a result`, () => {
        expect(argparse.getArgValue('kebab-case-key')).toBe('a value');
      });
    });
  });

  describe('getFlag()', () => {
    let argparse;

    beforeEach(() => {
      minimist.mockReturnValue({ 'flag-true': 1, 'flag-false': 0 });
      argparse = require('./argparse');
    });

    it('should return true if flag value is truthy', () => {
      expect(argparse.getFlag('flag-true')).toBe(true);
    });

    it('should return false if flag is not set', () => {
      expect(argparse.getFlag('flag-false')).toBe(false);
    });

    it('should return true if flag is not set', () => {
      expect(argparse.getFlag('flag-missing')).toBe(false);
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
});
