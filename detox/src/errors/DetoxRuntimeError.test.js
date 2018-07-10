const _ = require('lodash');
const DetoxRuntimeError = require('./DetoxRuntimeError');

describe(DetoxRuntimeError, () => {
  afterAll(() => {
    DetoxRuntimeError.formatMessagesOnFly = true;
  });

  it('should have various ways to create it', () => {
    DetoxRuntimeError.formatMessagesOnFly = false;

    expect(_.mapValues(varietiesOfInstantiation(), e => ({
      message: e.message,
      hint: e.hint,
      debugInfo: e.debugInfo,
    }))).toMatchSnapshot();
  });

  it('should format its fields to a single message if needed', () => {
    DetoxRuntimeError.formatMessagesOnFly = true;

    expect(_.mapValues(varietiesOfInstantiation(), 'message')).toMatchSnapshot();
  });

  function varietiesOfInstantiation() {
    return {
      'no args': new DetoxRuntimeError(),
      'empty object': new DetoxRuntimeError({}),
      'only message': new DetoxRuntimeError({ message: 'message' }),
      'message with hint': new DetoxRuntimeError({ message: 'message', hint: 'hint' }),
      'message with debug info': new DetoxRuntimeError({ message: 'message', debugInfo: 'debugInfo' }),
      'message with hint and debug info': new DetoxRuntimeError({ message: 'message', hint: 'hint', debugInfo: 'debugInfo' }),
    };
  }
});
