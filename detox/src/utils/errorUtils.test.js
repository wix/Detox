const { asError, removeInternalStackEntries } = require('./errorUtils');

describe('removeInternalStackEntries', () => {
  let error;

  beforeEach(() => {
    error = new Error('This is a test error\non multiple lines.');
    error.stack = `Error: This is a test error
on multiple lines.
    at Object.<anonymous> (/home/noomorph/Projects/wix/Detox/detox/src/utils/errorUtils.test.js:19:12)
    at Object.asyncJestTest (/home/noomorph/Projects/wix/Detox/detox/node_modules/jest-jasmine2/build/jasmineAsyncInstall.js:100:37)
    at /home/noomorph/Projects/wix/Detox/detox/node_modules/jest-jasmine2/build/queueRunner.js:47:12
    at new Promise (<anonymous>)
    at mapper (/home/noomorph/Projects/wix/Detox/detox/node_modules/jest-jasmine2/build/queueRunner.js:30:19)
    at /home/noomorph/Projects/wix/Detox/detox/node_modules/jest-jasmine2/build/queueRunner.js:77:41
    at processTicksAndRejections (internal/process/task_queues.js:97:5)`;
  });

  it('should include regular stack lines and omit detox/src stack lines', () => {
    expect(removeInternalStackEntries(error).stack).toBe(`Error: This is a test error
on multiple lines.
    at Object.asyncJestTest (/home/noomorph/Projects/wix/Detox/detox/node_modules/jest-jasmine2/build/jasmineAsyncInstall.js:100:37)
    at /home/noomorph/Projects/wix/Detox/detox/node_modules/jest-jasmine2/build/queueRunner.js:47:12
    at new Promise (<anonymous>)
    at mapper (/home/noomorph/Projects/wix/Detox/detox/node_modules/jest-jasmine2/build/queueRunner.js:30:19)
    at /home/noomorph/Projects/wix/Detox/detox/node_modules/jest-jasmine2/build/queueRunner.js:77:41
    at processTicksAndRejections (internal/process/task_queues.js:97:5)`);
  });
});

describe('asError', () => {
  it('should pass through errors', () => {
    const e = new Error();
    expect(asError(e)).toBe(e);
  });

  it('should wrap non-errors with new Error()', () => {
    expect(asError(42)).toEqual(new Error('42'));
  });
});
