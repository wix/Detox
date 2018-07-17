const { exec } = require('child-process-promise');
const DetoxRuntimeError = require('../errors/DetoxRuntimeError');

describe('logError', () => {
  let npmlog;
  let logError;

  beforeEach(() => {
    jest.mock('npmlog');
    npmlog = require('npmlog');

    logError = require('./logError');
  });

  it('should not fail on nulls', () => {
    logError(null);
    expect(npmlog.error).toHaveBeenCalledWith('detox', expect.any(String));

    logError(null, 'module');
    expect(npmlog.error).toHaveBeenCalledWith('module', expect.any(String));

    expect(npmlog.warn).not.toHaveBeenCalled();
    expect(npmlog.verbose).not.toHaveBeenCalled();
  });

  it('should log child process errors', async () => {
    await exec('sdfhkdshfjksdhfjkhks').catch(logError);

    expect(npmlog.error).toHaveBeenCalledWith('detox', '%s', expect.any(String));
    expect(npmlog.verbose).toHaveBeenCalledWith('child-process-stdout', '%s', expect.any(String));
    expect(npmlog.verbose).toHaveBeenCalledWith('child-process-stderr', '%s', expect.any(String));
    expect(npmlog.warn).not.toHaveBeenCalled();
  })

  it('should log long detox runtime errors', () => {
    const err = new DetoxRuntimeError({
      message: 'msg123',
      hint: 'hint',
      debugInfo: 'debugInfo',
    });

    logError(err, 'module');

    expect(npmlog.error).toHaveBeenCalledWith('module', '%s', expect.stringContaining('msg123'));
    expect(npmlog.warn).toHaveBeenCalledWith('module', 'Hint: %s', 'hint');
    expect(npmlog.warn).toHaveBeenCalledWith('module', 'See debug info below:\n%s', 'debugInfo');
    expect(npmlog.verbose).not.toHaveBeenCalled();
  })

  it('should log short detox runtime errors', () => {
    logError(new DetoxRuntimeError({ message: 'short' }));

    expect(npmlog.error).toHaveBeenCalledWith('detox', '%s', expect.stringContaining('short'));
    expect(npmlog.warn).not.toHaveBeenCalled();
    expect(npmlog.verbose).not.toHaveBeenCalled();
  })

  it('should log oother errors', () => {
    const err = new Error('message');
    logError(err);

    expect(npmlog.error).toHaveBeenCalledWith('detox', '', err);
    expect(npmlog.warn).not.toHaveBeenCalled();
    expect(npmlog.verbose).not.toHaveBeenCalled();
  })
});

