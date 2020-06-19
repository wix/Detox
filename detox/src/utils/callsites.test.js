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

  describe('.getOrigin()', () => {
    it('should return user code location', function it() {
      expect(callsites.getOrigin(0)).toMatch(/^at (.*):(\d+):(\d+)$/);
      expect(callsites.getOrigin(0)).toContain(path.normalize('src/utils/callsites.js'));
      expect(callsites.getOrigin(1)).toMatch(/^at (.*):(\d+):(\d+)$/);
      expect(callsites.getOrigin(1)).toContain(path.normalize('src/utils/callsites.test.js'));
    });
  });

  describe('.getStackDump', () => {
    const callStackDumpFromWrapperFn = (endFrame) => callsites.getStackDump(endFrame);
    const callStackDumpFromTwoWrapperFn = (endFrame) => callStackDumpFromWrapperFn(endFrame);

    const expectedTopFrameRegExp = /^ {4}at callStackDumpFromWrapperFn \(src[\\/]utils[\\/]callsites\.test\.js:[0-9][0-9]?:[0-9][0-9]?\)/;
    const expected2ndLineRegExp = /^ {4}at callStackDumpFromTwoWrapperFn \(src[\\/]utils[\\/]callsites\.test\.js:[0-9][0-9]?:[0-9][0-9]?\)/;

    it('should return a valid, multi-line, stack-dump string', () => {
      const stackdump = callStackDumpFromTwoWrapperFn();

      expect(stackdump).toEqual(expect.stringMatching(expectedTopFrameRegExp));
      expect(stackdump).toEqual(expect.stringMatching(new RegExp(expected2ndLineRegExp, 'm')));
    });

    it('should slice according to end-frame arg', () => {
      const _expectedTopLineRegExp = expected2ndLineRegExp;
      const stackdump = callStackDumpFromTwoWrapperFn(1);
      expect(stackdump).toEqual(expect.stringMatching(_expectedTopLineRegExp));
    });
  });
});
