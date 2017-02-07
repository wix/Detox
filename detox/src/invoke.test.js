const invoke = require('./invoke');

describe('invoke', () => {
  let WebsocketClient;

  beforeEach(() => {
    jest.mock('./websocket');
    jest.mock('./invoke/Invoke');
    WebsocketClient = require('./websocket');
  });

  it(`execute() should trigger executionHandler.execute()`, () => {
    const invocationManager = new invoke.InvocationManager(new WebsocketClient(""));
    invocationManager.execute();
    expect(invocationManager.executionHandler.execute).toHaveBeenCalled();
  });

  it(`invoke.IOS.{anything} will create an instance of {generic} invoke object`, () => {
    expect(invoke.IOS.CGPoint({x: 2, y: 1})).toEqual({type: 'CGPoint', value: {x: 2, y: 1}});
    expect(invoke.IOS.CGRect({x: 12, y: 11})).toEqual({type: 'CGRect', value: {x: 12, y: 11}});
    expect(invoke.IOS.Anything(1)).toEqual({type: 'Anything', value: 1});
  });
});
