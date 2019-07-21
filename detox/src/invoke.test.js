const invoke = require('./invoke');

describe('invoke', () => {
  let Client;

  beforeEach(() => {
    jest.mock('./client/Client');
    jest.mock('./invoke/Invoke');
    Client = require('./client/Client');
  });

  it(`execute() should trigger executionHandler.execute()`, () => {
    const invocationManager = new invoke.InvocationManager(new Client(""));
    invocationManager.execute();
    expect(invocationManager.executionHandler.execute).toHaveBeenCalled();
  });

  it(`execute should return execution result`, async () => {
    const client = new Client("");
    const someResult = 'some_result';
    client.execute.mockReturnValue(someResult);
    const invocationManager = new invoke.InvocationManager(client);
    const result = await invocationManager.execute();
    expect(result).toEqual(someResult)
  });

  it(`invoke.IOS.{anything} will create an instance of {generic} invoke object`, () => {
    expect(invoke.IOS.CGPoint({x: 2, y: 1})).toEqual({type: 'CGPoint', value: {x: 2, y: 1}});
    expect(invoke.IOS.CGRect({x: 12, y: 11})).toEqual({type: 'CGRect', value: {x: 12, y: 11}});
    expect(invoke.IOS.Anything(1)).toEqual({type: 'Anything', value: 1});
  });
});
