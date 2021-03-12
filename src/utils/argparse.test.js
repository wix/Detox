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
});
