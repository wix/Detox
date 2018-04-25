const {call} = require('./Invoke');

describe('call', () => {
  it('handles target as thunk', () => {
    expect(call(() =>  'fn', 'method')()).toEqual({
      target: { type: 'Invocation', value: 'fn' },
      method: 'method',
      args: []
    })
  });
});
