const DetoxRuntimeError = require('./DetoxRuntimeError');

describe('DetoxRuntimeError', () => {
  it.each(varietiesOfInstantiation())('should be created with %s', (description, error) => {
    expect(error).toMatchSnapshot();
  });

  it('should format string as well, similar to Error', () => {
    expect(new DetoxRuntimeError('Test')).toEqual(new DetoxRuntimeError({
      message: 'Test'
    }));
  });

  it('should format any object to an error message', () => {
    expect(DetoxRuntimeError.format({})).toBe('{}');

    const err = new Error('Command failed: echo Hello world');
    expect(DetoxRuntimeError.format(err)).toBe(err.message);

    err.message = 'Other error message';
    expect(DetoxRuntimeError.format(err)).toBe(err.stack);

    delete err.stack;
    expect(DetoxRuntimeError.format(err)).toBe(err.toString());

    delete err.message;
    expect(DetoxRuntimeError.format(err)).toBe('[Error]');

    const runtimeError = new DetoxRuntimeError({
      message: 'msg',
      hint: 'hint',
    });

    expect(DetoxRuntimeError.format(runtimeError)).toBe(runtimeError.message);
  });

  function varietiesOfInstantiation() {
    return Object.entries({
      'no args': new DetoxRuntimeError(),
      'plain string': new DetoxRuntimeError('A plain message'),
      'empty object': new DetoxRuntimeError({}),
      'only message': new DetoxRuntimeError({
        message: `The video is not being recorded on device (${'emulator-5554'}) at path: ${'/sdcard/712398.mp4'}`,
      }),
      'message with no stack': new DetoxRuntimeError({
        message: 'Test message without a stack',
        noStack: true,
      }),
      'message with "Command failed" error': new DetoxRuntimeError({
        message: 'Cannot run Detox due to an internal error',
        debugInfo: new Error('Command failed: jest runMyTests'),
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
      'message with debug info object': new DetoxRuntimeError({
        message: 'no filename was given to constructSafeFilename()',
        debugInfo: {
          prefix: 'detox - ',
          trimmable: undefined,
          suffix: undefined,
        },
      }),
      'message with hint and debug info': new DetoxRuntimeError({
        message: `Invalid test summary was passed to detox.beforeEach(testSummary)` +
        '\nExpected to get an object of type: { title: string; fullName: string; status: "running" | "passed" | "failed"; }',
        hint: 'Maybe you are still using an old undocumented signature detox.beforeEach(string, string, string) in init.js ?' +
        '\nSee the article for the guidance: ' +
        'https://wix.github.io/Detox/docs/api/test-lifecycle',
        debugInfo: `testSummary was: ${JSON.stringify('test name')}`,
      }),
    });
  }
});
