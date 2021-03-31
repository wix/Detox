const LogInterceptor = require('./utils/log-interceptor');

describe(':android: App responsiveness', () => {
  it('should log ANR warning when app nonresponsive', async () => {
    const logInterceptor = new LogInterceptor();

    try {
      logInterceptor.startStderr();
      await element(by.text('ANR')).tap();
    } finally {
      logInterceptor.stopAll();
    }

    if (!logInterceptor.strerrData.includes('APP_NONRESPONSIVE')) {
      console.error('APP_NONRESPONSIVE warning-log was expected, but got:\n'+logInterceptor.strerrData);
      throw new Error('APP_NONRESPONSIVE not found in intercepted log');
    }
  });
});
