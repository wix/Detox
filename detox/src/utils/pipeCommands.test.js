const pipeCommands = require('./pipeCommands');

const _win32 = pipeCommands._win32();
const _nix = pipeCommands._nix();

describe('pipeUtils', () => {
  describe('escape in quoted string', () => {
    describe('on win32', () => {
      const escape = _win32.escape.inQuotedString;

      it('should escape double quotes with double quotes', () =>
        expect(escape('Says "Hello"')).toMatchSnapshot());
    });

    describe('on *nix', () => {
      const escape = _nix.escape.inQuotedString;

      it('should escape double quotes with slash', () =>
        expect(escape('Says "Hello"')).toMatchSnapshot());
    });
  });

  describe('escape in quoted regexp', () => {
    describe('on win32', () => {
      const escape = _win32.escape.inQuotedRegexp;

      it('should escape only double quotes', () =>
        expect(escape('^Hello\\s ".*"$')).toMatchSnapshot());
    });

    describe('on *nix', () => {
      const escape = _nix.escape.inQuotedRegexp;

      it('should not escape non-special characters', () =>
        expect(escape('bundle_name')).toMatchSnapshot());

      it('should escape double quotes with slash', () =>
        expect(escape('"a')).toMatchSnapshot());

      it('should escape [\\]', () =>
        expect(escape('[kworker\\0:0]')).toMatchSnapshot());

      it('should escape ^*$', () =>
        expect(escape('^ma*tch$')).toMatchSnapshot());

      it('should escape dots', () =>
        expect(escape('com.company.bundle')).toMatchSnapshot());
    });
  });

  describe('search by regexp pipe command', () => {
    const regexp = '^Hello\\s ".*"$';

    describe('on win32', () => {
      const search = _win32.search.regexp;

      it('should use findstr /R /C:"regexp"', () =>
        expect(search(regexp)).toMatchSnapshot());
    });

    describe('on *nix', () => {
      const search = _nix.search.regexp;

      it('should use grep "regexp"', () =>
        expect(search(regexp)).toMatchSnapshot());
    });
  });

  describe('search by fragment pipe command', () => {
    const fragment = '^Hello\\s ".*"$';

    describe('on win32', () => {
      const search = _win32.search.fragment;

      it('should use findstr /C:"fragment"', () =>
        expect(search(fragment)).toMatchSnapshot());
    });

    describe('on *nix', () => {
      const search = _nix.search.fragment;

      it('should use grep -e "fragment"', () =>
        expect(search(fragment)).toMatchSnapshot());
    });
  });
});
