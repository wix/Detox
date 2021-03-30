const DetoxRuntimeError = require('../../errors/DetoxRuntimeError');
const RegisteredConnectionHandler = require('./RegisteredConnectionHandler');

class TesterConnectionHandler extends RegisteredConnectionHandler {
  constructor({ api, session }) {
    super({ api, session, role: 'tester' });
  }

  handle(action) {
    /* istanbul ignore next */
    if (super.handle(action)) {
      return true;
    }

    if (this._session.app) {
      this._session.app.sendAction(action);
      return true;
    }

    if (action.type === 'cleanup') {
      // returns "cleanupDone" stub
      // for the case when no app is already running
      this._api.sendAction({
        type: 'cleanupDone',
        messageId: action.messageId
      });

      return true;
    }

    throw new DetoxRuntimeError({
      message: 'Failed to reach the app over the web socket connection.',
      hint: `

1. Make sure your app is actually running on the device.
 If not - perhaps you forgot to write 'device.launchApp()'
 somewhere at the beginning of your test. There's also a
 chance that your app has crashed - use --record-logs CLI
 option to get the logs.

2. If your app IS running on the device, yet you see this message:
a) The native part of Detox failed to connect to the Detox server over
   web sockets.
   If this is the case, the logs from the app (e.g., --record-logs all)
   should be containing messages about those failed connection attempts.

b) The app is running without Detox native code injected.
   First, make sure you don't launch it manually — leave that to Detox.
   If you do need to launch your app manually, pay attention to:
     - (iOS) SIMCTL_CHILD_DYLD_INSERT_LIBRARIES environment variable
       It should point to the current Detox.framework path.
     - (Android) Correctness of the selected Android Instrumentation Runner
       and test class.

The following package could not be delivered:`,
      debugInfo: action,
    });
  }
}

module.exports = TesterConnectionHandler;
