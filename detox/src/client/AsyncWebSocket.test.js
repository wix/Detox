const _ = require('lodash');
const config = require('../schemes.mock').valid.session;

describe('AsyncWebSocket', () => {
  let AsyncWebSocket;
  let WebSocket;
  let client;

  beforeEach(() => {
    WebSocket = jest.mock('ws');
    AsyncWebSocket = require('./AsyncWebSocket');
    client = new AsyncWebSocket(config.server);

  });

  it(`new AsyncWebSocket - websocket onOpen should resolve`, async () => {
    const result = {};
    const promise = client.open();
    emitEvent('open', result);
    expect(await promise).toEqual(result);
  });

  it(`new AsyncWebSocket - websocket onError should reject`, async () => {
    const error = new Error();
    const promise = client.open();
    emitEvent('error', error);

    try {
      await promise;
    } catch (ex) {
      expect(ex).toEqual(error);
    }
  });

  it(`send message on a closed connection should throw` ,async () => {
  try {
    await client.send({message: 'a message'});
  } catch (ex) {
    expect(ex).toBeDefined();
  }
  });

  it(`send message should resolve upon returning message` ,async () => {
    const response = 'response';
    connect(client);
    const promise = client.send({message: 'a message'});
    emitEvent('message', response);
    expect(await promise).toEqual(response)
  });

  it(`send message should reject upon error`, async () => {
    connect(client);
    const error = new Error();
    const promise = client.send({message: 'a message'});
    emitEvent('error', error);
    try {
      await promise;
    } catch (ex) {
      expect(ex).toEqual(error);
    }
  });

  it(`close a connected websocket should close and resolve` ,async () => {
    connect(client);
    const promise = client.close();
    emitEvent('close', {});
    expect(await promise).toEqual({});
  });

  it(`close a connected websocket should close and resolve` ,async () => {
    connect(client);
    client.ws.readyState = 1;//Websocket.OPEN
    const promise = client.close();
    emitEvent('close', {});

    expect(await promise).toEqual({});
  });

  it(`close a disconnected websocket should resolve` ,async () => {
    connect(client);
    client.ws.readyState = 3;//Websocket.CLOSED
    const promise = client.close();
    emitEvent('close', {});

    expect(await promise).toEqual({});
  });

  async function connect(client) {
    const result = {};
    const promise = client.open();
    emitEvent('open', result);
    await promise;
  }

  it(`closing a non-initialized websocket should throw`, async () => {
    const promise = client.close();

    try {
      await promise;
    } catch (ex) {
      expect(ex).toBeDefined();
    }
  });

  function emitEvent(eventName, params) {
    _.fromPairs(client.ws.on.mock.calls)[eventName](params);
  }
});
