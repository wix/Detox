const DetoxRuntimeError = require('../DetoxRuntimeError');

const message = 'Detox can\'t seem to connect to the test app(s)!';
const troubleshootingRefMessage = 'Refer to our troubleshooting guide, for full details: https://wix.github.io/Detox/docs/troubleshooting/running-tests#tests-execution-hangs';

const hintMaybeNotLaunched = `\
Have you forgotten to call 'device.launchApp()' in the beginning of your test?
${troubleshootingRefMessage}\
`;

const hintAppWasLaunched = `The test app might have crashed prematurely, or has had trouble setting up the connection.
${troubleshootingRefMessage} 
`;

const payloadAppendix = `---
The following package could not be delivered:\
`;

const reformatSection = (s) => '\n\n' + s;

function maybeAppWasNotLaunched(action) {
  return new DetoxRuntimeError({
    message,
    hint: [hintMaybeNotLaunched, payloadAppendix].map(reformatSection).join(''),
    debugInfo: action,
  });
}

function evenThoughAppWasLaunched() {
  return new DetoxRuntimeError({
    message,
    hint: reformatSection(hintAppWasLaunched),
  });
}

module.exports = {
  maybeAppWasNotLaunched,
  evenThoughAppWasLaunched,
};
