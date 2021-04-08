const DetoxRuntimeError = require('../DetoxRuntimeError');

const message = 'Failed to reach the app over the web socket connection.';

const hint1_B = `\
1. If you don't see your app running on the device, there's a chance
   that your app has crashed prematurely. To get the crash details,
   you can run Detox tests with "--record-logs all" CLI option
   and then inspect the device logs in the artifacts folder.\
`;

const hint1_A = `\
Have you forgotten to write 'device.launchApp()' at the beginning
of your test? If that's not the case, see the other options.

${hint1_B}
`;

const hint2 = `\
2. If your app IS running on the device, yet you see this message:
a) The native part of Detox failed to connect to the Detox server over
   web sockets. If this is the case, the device's logs should contain
   messages about those failed connection attempts.

b) The app is running without Detox native code injected.
   Make sure you don't launch it manually. If you don't, examine the logs
   from the device. If you see a crash related to Detox native code, you
   are welcome to report it on our GitHub tracker.
   In case if you are debugging your native code integration with Detox,
   these guides may prove helpful:

   * https://github.com/wix/Detox/blob/master/docs/Guide.DebuggingInAndroidStudio.md
   * https://github.com/wix/Detox/blob/master/docs/Guide.DebuggingInXcode.md\
`;

const payloadAppendix = `\
The following package could not be delivered:\
`;

function maybeAppWasNotLaunched(action) {
  return new DetoxRuntimeError({
    message,
    hint: [hint1_A, hint2, payloadAppendix].map(s => '\n\n' + s).join(''),
    debugInfo: action,
  });
}

function evenThoughAppWasLaunched() {
  return new DetoxRuntimeError({
    message,
    hint: [hint1_B, hint2].map(s => '\n\n' + s).join(''),
  });
}

module.exports = {
  maybeAppWasNotLaunched,
  evenThoughAppWasLaunched,
};
