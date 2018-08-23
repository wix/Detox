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

  describe('composeArgs()', () => {
    let composeArgs;

    beforeEach(() => {
      composeArgs = require('./argparse').composeArgs;
    });

    it('by default, should convert { byId: 100 } to "--byId 100"', () => {
      expect(composeArgs({ byId: 100 })).toBe('--byId 100');
    });

    it('should convert camelcase to kebab case, if turned on', () => {
      const options = { kebab: true };
      expect(composeArgs({ byId: 100 }, options)).toBe('--by-id 100');
    });

    it('should quote-escape values with spaces inside', () => {
      expect(composeArgs({ query: "equals \"iPhone X\"" })).toBe('--query "equals \\\"iPhone X\\\""');
    });

    it('should convert { enabled: true } to "--enabled" because it is boolean', () => {
      expect(composeArgs({ enabled: true })).toBe('--enabled');
    });

    it('should omit { enabled: false } to because it is false', () => {
      expect(composeArgs({ enabled: false })).toBe('');
    });

    it('should convert { e: true } to -e if prefix is "-"', () => {
      expect(composeArgs({ e: true }, { prefix: '-' })).toBe('-e');
    });

    it('should convert { arg1: true, arg2: "arg3" } to "arg1 arg2 arg3" if there is no prefix', () => {
      const options = { prefix: false };
      expect(composeArgs({ arg1: true, arg2: 'arg3' }, options)).toBe('arg1 arg2 arg3');
    });
  });
});
