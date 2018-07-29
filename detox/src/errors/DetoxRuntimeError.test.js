const _ = require('lodash');
const DetoxRuntimeError = require('./DetoxRuntimeError');

describe(DetoxRuntimeError, () => {
  it('should format all fields to a single message', () => {
    _.forEach(varietiesOfInstantiation(), (error, description) => {
      expect(error.toString()).toMatchSnapshot(`.toString() - ${description}`);
      expect(() => { throw error; }).toThrowErrorMatchingSnapshot(`throw error - ${description}`);
    });
  });

  function varietiesOfInstantiation() {
    return {
      'no args': new DetoxRuntimeError(),
      'empty object': new DetoxRuntimeError({}),
      'only message': new DetoxRuntimeError({
        message: `The video is not being recorded on device (${'emulator-5554'}) at path: ${'/sdcard/712398.mp4'}`,
      }),
      'message with hint': new DetoxRuntimeError({
        message: 'Detox adapter to Jest is malfunctioning.',
        hint: `Make sure you register it as Jasmine reporter inside init.js:\n` +
              `-------------------------------------------------------------\n` +
              'jasmine.getEnv().addReporter(adapter);',
      }),
      'message with debug info': new DetoxRuntimeError({
        message: 'no filename was given to constructSafeFilename()',
        debugInfo: 'the arguments were: ' + JSON.stringify({
          prefix: 'detox - ',
          trimmable: undefined,
          suffix: undefined,
        }, null, 2),
      }),
      'message with hint and debug info': new DetoxRuntimeError({
        message: `Invalid test summary was passed to detox.beforeEach(testSummary)` +
        '\nExpected to get an object of type: { title: string; fullName: string; status: "running" | "passed" | "failed"; }',
        hint: 'Maybe you are still using an old undocumented signature detox.beforeEach(string, string, string) in init.js ?' +
        '\nSee the article for the guidance: ' +
        'https://github.com/wix/detox/blob/master/docs/APIRef.TestLifecycle.md',
        debugInfo: `testSummary was: ${JSON.stringify('test name')}`,
      }),
    };
  }
});
