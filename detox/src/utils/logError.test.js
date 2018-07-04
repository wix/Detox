const { exec } = require('child-process-promise');
const DetoxRuntimeError = require('../errors/DetoxRuntimeError');
const mockLogger = require('./__mocks__/logger');
const logError = require('./logError');

describe('logError', () => {
  it('should not fail on nulls', () => {
    logError(mockLogger, null);
    expect(mockLogger.error.mock.calls).toMatchSnapshot();
  });

  it('should skip child process errors', async () => {
    await exec('sdfhkdshfjksdhfjkhks').catch((e) => logError(mockLogger, e));
    expect(mockLogger.error).not.toHaveBeenCalled();
    expect(mockLogger.warn).not.toHaveBeenCalled();
  });

  it('should log long detox runtime errors', () => {
    const err = new DetoxRuntimeError({
      message: 'msg123',
      hint: 'hint',
      debugInfo: 'debugInfo',
    });
    hideStack(err);

    logError(mockLogger, err);

    expect(mockLogger.error.mock.calls).toMatchSnapshot();
    expect(mockLogger.warn.mock.calls).toMatchSnapshot();
  });

  it('should log short detox runtime errors', () => {
    const err = new DetoxRuntimeError({ message: 'short' });
    hideStack(err);
    logError(mockLogger, err);

    expect(mockLogger.error.mock.calls).toMatchSnapshot();
    expect(mockLogger.warn).not.toHaveBeenCalled();
  });

  it('should log other errors', () => {
    const err = new Error('message');
    hideStack(err);
    logError(mockLogger, err);

    expect(mockLogger.error).toHaveBeenCalledWith({ err }, err);
    expect(mockLogger.warn).not.toHaveBeenCalled();
  });
});

function hideStack(err) {
  err.stack = replaceLinesAfterTheFirst(err.stack, '  at fake error stack');
}

function replaceLinesAfterTheFirst(str, replacement) {
  const [first, ...rest] = str.split('\n');

  return (rest.length > 0)
    ? first + '\n' + replacement
    : first;
}
