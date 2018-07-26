const _ = require('lodash');
const DetoxRuntimeError = require('./DetoxRuntimeError');

describe(DetoxRuntimeError, () => {
  it('should format its fields to a single message if needed', () => {
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
      'toString': { message: new DetoxRuntimeError({ message: 'message', hint: 'hint', debugInfo: 'debugInfo' }).toString() },
    };
  }
});
