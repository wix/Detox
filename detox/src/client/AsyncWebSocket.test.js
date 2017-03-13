const _ = require('lodash');
const config = require('../schemes.mock').validOneDeviceAndSession.session;

describe('AsyncWebSocket', () => {
  let AsyncWebSocket;
  let WebSocket;
  let client;

  beforeEach(() => {
    jest.mock('npmlog');
    WebSocket = jest.mock('ws');
    WebSocket.OPEN = 1;
    WebSocket.CLOSED = 3;

    AsyncWebSocket = require('./AsyncWebSocket');
    client = new AsyncWebSocket(config.server);
  });

  it(`new AsyncWebSocket - websocket onOpen should resolve`, async () => {
    const response = {response: 'onopen'};
    const promise = client.open();
    client.ws.onopen(response);
    expect(await promise).toEqual(response);
  });

  it(`new AsyncWebSocket - websocket onError should reject`, async () => {
    const error = new Error();
    const promise = client.open();
    client.ws.onerror(error);

    try {
      await promise;
    } catch (ex) {
      expect(ex).toEqual(error);
    }
  });

  it(`send message on a closed connection should throw`, async () => {
    try {
      await client.send({message: 'a message'});
    } catch (ex) {
      expect(ex).toBeDefined();
    }
  });

  it(`send message should resolve upon returning message`, async () => {
    const response = {data: {response: 'onmessage'}};
    await connect(client);

    const promise = client.send({message: 'a message'});
    client.ws.onmessage(response);
    expect(await promise).toEqual(response.data);
  });

  it(`send message should reject upon error`, async () => {
    await connect(client);
    const error = new Error();
    const promise = client.send({message: 'a message'});
    client.ws.onerror(error);
    try {
      await promise;
    } catch (ex) {
      expect(ex).toEqual(error);
    }
  });

  it(`close a connected websocket should close and resolve`, async () => {
    await connect(client);
    const promise = client.close();
    client.ws.onclose({});
    expect(await promise).toEqual({});
  });

  it(`close a connected websocket should close and resolve`, async () => {
    const result = {};
    await connect(client);
    client.ws.readyState = WebSocket.OPEN;
    const promise = client.close();
    client.ws.onclose(result);
    expect(await promise).toEqual(result);
  });

  it(`close a disconnected websocket should resolve`, async () => {
    await connect(client);
    client.ws.readyState = WebSocket.CLOSED;
    await client.close();
    expect(client.ws).toBeNull();
  });

  it(`client.isOpen() should return false when closed, open when opened`, async () => {
    expect(client.isOpen()).toBe(false);
    await connect(client);
    client.ws.readyState = WebSocket.OPEN;
    expect(client.isOpen()).toBe(true);
  });

  it(`closing a non-initialized websocket should throw`, async () => {
    const promise = client.close();
    try {
      await promise;
    } catch (ex) {
      expect(ex).toBeDefined();
    }
  });

  async function connect(client) {
    const result = {};
    const promise = client.open();
    client.ws.onopen(result);
    await promise;
  }
});
