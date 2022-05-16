const path = require('path');

describe('callsites', () => {
  let callsites;

  beforeEach(() => {
    callsites = require('./callsites');
  });

  describe('.getCallSites()', () => {
    it('should return a query-able callsites array', function it() {
      const callFromWrapperFn = () => callsites.getCallSites();
      const [callsite0, callsite1] = callFromWrapperFn();

      const expectedFileName = path.normalize('src/utils/callsites.test.js');

      expect(callsite0.getFileName()).toEqual(expect.stringContaining(expectedFileName));
      expect(callsite0.getFunctionName()).toEqual('callFromWrapperFn');
      expect(callsite0.isToplevel()).toEqual(true);

      expect(callsite1.getFunctionName()).toEqual('it');
      expect(callsite1.isToplevel()).toEqual(false);
    });
  });

  describe('.getStackDump', () => {
    const callStackDumpFromWrapperFn = (endFrame) => callsites.getStackDump(endFrame);
    const callStackDumpFromTwoWrapperFn = (endFrame) => callStackDumpFromWrapperFn(endFrame);

    const expectedTopFrameRegExp = /^ {4}at (?:Object\.)?callStackDumpFromWrapperFn \(src[\\/]utils[\\/]callsites\.test\.js:[0-9][0-9]?:[0-9][0-9]?\)/;
    const expected2ndLineRegExp = /^ {4}at (?:Object\.)?callStackDumpFromTwoWrapperFn \(src[\\/]utils[\\/]callsites\.test\.js:[0-9][0-9]?:[0-9][0-9]?\)/;

    it('should return a valid, multi-line, stack-dump string', () => {
      const [,line1,line2] = callStackDumpFromTwoWrapperFn().split('\n');

      expect(line1).toEqual(expect.stringMatching(expectedTopFrameRegExp));
      expect(line2).toEqual(expect.stringMatching(expected2ndLineRegExp));
    });

    it('should slice according to end-frame arg', () => {
      const [,line1] = callStackDumpFromTwoWrapperFn(1).split('\n');
      expect(line1).toEqual(expect.stringMatching(expected2ndLineRegExp));
    });
  });

  describe('.getOrigin(callSite)', () => {
    it('should include log origin', () => {
      const fakeCallSite = {
        getFileName: () => 'MOCK_FILE',
        getLineNumber: () => 200,
        getColumnNumber: () => 100,
      };

      const origin = callsites.getOrigin(fakeCallSite);
      expect(origin).toBe('at MOCK_FILE:200:100');
    });

    it('should use relative file-name rather than absolute in origin', () => {
      const fakeCallSite = {
        getFileName: () => path.join(process.cwd(), 'src/index.js'),
        getLineNumber: () => 1,
        getColumnNumber: () => 1,
      };

      const origin = callsites.getOrigin(fakeCallSite);
      expect(origin).toBe(`at ${path.normalize('src/index.js')}:1:1`);
    });

    it('should handle null callsite', () => {
      const origin = callsites.getOrigin(null);
      expect(origin).toBe('at <unknown>:?:?');
    });

    it('should handle null fileName', () => {
      const origin = callsites.getOrigin({
        getFileName: () => null,
        getLineNumber: () => 42,
        getColumnNumber: () => 42,
      });

      expect(origin).toBe('at <unknown>:42:42');
    });

    it('should handle null lineNumber', () => {
      const origin = callsites.getOrigin({
        getFileName: () => 'index.js',
        getLineNumber: () => null,
        getColumnNumber: () => 42,
      });

      expect(origin).toBe('at index.js:?:42');
    });

    it('should handle null columnNumber', () => {
      const origin = callsites.getOrigin({
        getFileName: () => 'index.js',
        getLineNumber: () => 42,
        getColumnNumber: () => null,
      });

      expect(origin).toBe('at index.js:42:?');
    });
  });
});
