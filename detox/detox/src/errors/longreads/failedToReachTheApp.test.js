const failedToReachTheApp = require('./failedToReachTheApp');

describe('failedToReachTheApp', () => {
  test('.evenThoughAppWasLaunched()', () => {
    expect(failedToReachTheApp.evenThoughAppWasLaunched()).toMatchSnapshot();
  });

  test('.maybeAppWasNotLaunched(action)', () => {
    expect(failedToReachTheApp.maybeAppWasNotLaunched({
      type: 'isReady',
      messageId: -1000
    })).toMatchSnapshot();
  });
});
