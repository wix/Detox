const {call} = require('./Invoke');

describe('call', () => {
  it('handles target as thunk', () => {
    expect(call(() =>  'fn', 'method')()).toEqual({
      target: { type: 'Invocation', value: 'fn' },
      method: 'method',
      args: []
    });
  });

  it('handles arguments as thunk', () => {
    expect(call('fn', 'method', 'no-thunk', () => 'a-thunk')()).toEqual({
      target: 'fn',
      method: 'method',
      args: ['no-thunk', { type: 'Invocation', value: 'a-thunk' }]
    });
  });
});
