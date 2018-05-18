const _ = require('lodash');
const DetoxRuntimeError = require('./DetoxRuntimeError');

describe(DetoxRuntimeError, () => {
  it('should have various ways to create it', () => {
    const varieties = {
      'no args': new DetoxRuntimeError(),
      'empty object': new DetoxRuntimeError({}),
      'only message': new DetoxRuntimeError({ message: 'message' }),
      'message with hint': new DetoxRuntimeError({ message: 'message', hint: 'hint' }),
      'message with debug info': new DetoxRuntimeError({ message: 'message', debugInfo: 'debugInfo' }),
      'message with hint and debug info': new DetoxRuntimeError({ message: 'message', hint: 'hint', debugInfo: 'debugInfo' }),
    };

    expect(_.mapValues(varieties, e => ({
      message: e.message,
      hint: e.hint,
      debugInfo: e.debugInfo,
    }))).toMatchSnapshot();
  });
});
