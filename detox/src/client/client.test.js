const config = require('../schemes.mock').valid.session;
const invoke = require('../invoke');

describe('client', () => {
  let WebScoket;
  let Client;
  let client;

  beforeEach(() => {
    jest.mock('npmlog');
    WebScoket = jest.mock('./AsyncWebSocket');
    Client = require('./client');
  });



  it(`reloadReactNative should receive ready from device and resolve`, async () => {
    await connect();
    client.ws.send.mockReturnValueOnce(Promise.resolve(`{"type":"ready","params": {}}`));
    await client.reloadReactNative()
  });

  it(`reloadReactNative should throw if receives wrong response from device`, async () => {
    await connect();
    client.ws.send.mockReturnValueOnce(Promise.resolve(`{"type":"somethingElse","params": {}}`));
    try {
      await client.reloadReactNative()
    } catch (ex) {
      expect(ex).toBeDefined();
    }
  });

  it(`execute a successful command should resolve`, async () => {
    await connect();
    client.ws.send.mockReturnValueOnce(Promise.resolve(`{"type":"invokeResult","params":{"id":"0","result":"(GREYElementInteraction)"}}`));

    const call = invoke.call(invoke.IOS.Class('GREYMatchers'), 'matcherForAccessibilityLabel:', 'test');
    await client.execute(call);
  });

  it(`execute a successful command should resolve`, async () => {
    await connect();
    client.ws.send.mockReturnValueOnce(Promise.resolve(`{"type":"testFailed","params": {"details": "this is an error"}}`));

    const call = invoke.call(invoke.IOS.Class('GREYMatchers'), 'matcherForAccessibilityLabel:', 'test');
    try {
      await client.execute(call);
    } catch (ex) {
      expect(ex).toBeDefined();
    }
  });

  async function connect() {
    client = new Client(config);
    client.ws.send.mockReturnValueOnce(Promise.resolve(`{"type":"ready","params": {}}`));
    return await client.connect();
  }
});

