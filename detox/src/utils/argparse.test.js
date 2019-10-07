jest.unmock('process');

describe('argparse', () => {
  describe('getArgValue()', () => {
    describe('using env variables', () => {
      let argparse;

      beforeEach(() => {
        process.env.fooBar = 'a value';
        process.env.testUndefinedProp = 'undefined';
        argparse = require('./argparse');
      });

      it(`nonexistent key should return undefined result`, () => {
        expect(argparse.getArgValue('blah')).not.toBeDefined();
      });

      it(`existing key should return a result`, () => {
        expect(argparse.getArgValue('foo-bar')).toBe('a value');
      });

      it('should return undefiend if process.env contain something with a string of undefiend' ,() => {
        expect(argparse.getArgValue('testUndefinedProp')).toBe(undefined);
      });
    });

    describe('using arguments', () => {
      let argparse;

      beforeEach(() => {
        jest.mock('minimist');
        const minimist = require('minimist');
        minimist.mockReturnValue({'kebab-case-key': 'a value'});
        argparse = require('./argparse');
      });

      it(`nonexistent key should return undefined result`, () => {
        expect(argparse.getArgValue('blah')).not.toBeDefined();
      });

      it(`existing key should return a result`, () => {
        expect(argparse.getArgValue('kebab-case-key')).toBe('a value');
      });
    });
  });

  describe('getFlag()', () => {
    let argparse;

    beforeEach(() => {
      jest.mock('minimist');
      const minimist = require('minimist');
      minimist.mockReturnValue({'flag-true': 1, 'flag-false': 0});
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
  })
});
