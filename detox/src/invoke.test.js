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
});
