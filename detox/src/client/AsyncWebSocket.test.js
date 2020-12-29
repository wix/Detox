const _ = require('lodash');
const config = require('../configuration/configurations.mock').validOneDeviceAndSession.session;

describe('AsyncWebSocket', () => {
  let AsyncWebSocket;
  let WebSocket;
  let client;

  beforeEach(() => {
    jest.mock('../utils/logger');
    WebSocket = jest.mock('ws');
    WebSocket.OPEN = 1;
    WebSocket.CLOSED = 3;

    AsyncWebSocket = require('./AsyncWebSocket');
    client = new AsyncWebSocket(config.server);
  });

  it(`new AsyncWebSocket - websocket onOpen should resolve`, async () => {
    const response = generateResponse('onmessage', 0);
    const promise = client.open();
    client.ws.onopen(response);
    expect(await promise).toEqual(response);
  });

  it(`new AsyncWebSocket - websocket onError should reject`, async () => {
    const error = new Error();
    const promise = client.open();

    try {
      client.ws.onerror(error);
      await promise;
    } catch (ex) {
      expect(ex).toEqual(error);
    }
  });

  it(`send message on a closed connection should throw`, async () => {
    try {
      await client.send(generateRequest());
    } catch (ex) {
      expect(ex).toBeDefined();
    }
  });

  it(`message should have subsequent messageIds`, async () => {
    await connect(client);

    const request = generateRequest();
    const firstResponse = generateResponse('onmessage', 0);
    const secondResponse = generateResponse('onmessage', 1);

    const first = client.send(request);
    expect(request.messageId).toEqual(0);
    client.ws.onmessage(firstResponse);
    expect(await first).toEqual(firstResponse.data);

    const second = client.send(request);
    expect(request.messageId).toEqual(1);
    client.ws.onmessage(secondResponse);
    expect(await second).toEqual(secondResponse.data);
});

  it(`message response should resolve the calling request`, async () => {
    await connect(client);

    const request = generateRequest();
    const firstResponse = generateResponse('onmessage', 0);
    const secondResponse = generateResponse('onmessage', 1);

    const first = client.send(request);
    expect(request.messageId).toEqual(0);

    const second = client.send(request);
    expect(request.messageId).toEqual(1);

    client.ws.onmessage(secondResponse);
    client.ws.onmessage(firstResponse);

    expect(await second).toEqual(secondResponse.data);
    expect(await first).toEqual(firstResponse.data);
  });

  it(`message should be ignored if has no pending request`, async () => {
    await connect(client);

    const initialInflightPromisesSize = _.size(client.inFlightPromises);
    const response = generateResponse('onmessage', 123);
    client.ws.onmessage(response);

    const finalInflightPromisesSize = _.size(client.inFlightPromises);
    expect(initialInflightPromisesSize).toEqual(finalInflightPromisesSize);
  });

  it(`send message should resolve upon returning message`, async () => {
    await connect(client);
    const response = generateResponse('onmessage', 0);

    const promise = client.send(generateRequest());
    client.ws.onmessage(response);
    expect(await promise).toEqual(response.data);
  });

  it(`send message should reject upon error if there's only one message in flight`, async () => {
    await connect(client);
    const error = new Error();
    const message = client.send(generateRequest());
    client.ws.onerror(error);
    try {
      await message;
    } catch (ex) {
      expect(ex).toEqual(error);
    }
  });

  it(`send message should throw upon error if there's more than one message in flight`, async () => {
    await connect(client);
    const error = new Error();
    const message1 = client.send(generateRequest());
    const message2 = client.send(generateRequest());

    try {
      client.ws.onerror(error);
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

  it(`eventCallback should be triggered on a registered action.type when sent from app`, async () => {
    const mockCallback = jest.fn();
    const mockedResponse = generateResponse('someEvent', -10000);
    await connect(client);
    client.setEventCallback('someEvent', mockCallback);

    client.ws.onmessage(mockedResponse);
    expect(mockCallback).toHaveBeenCalledWith(JSON.parse(mockedResponse.data));
  });

  it(`multiple eventCallbacks can be triggered on the same action.type`, async () => {
    const mockCallbacks = [0, 1].map(i => jest.fn());
    const mockedResponse = generateResponse('someEvent', -10000);
    const mockResponseData = JSON.parse(mockedResponse.data);

    await connect(client);
    client.setEventCallback('someEvent', mockCallbacks[0]);
    client.setEventCallback('someEvent', mockCallbacks[1]);

    client.ws.onmessage(mockedResponse);

    expect(mockCallbacks[0]).toHaveBeenCalledWith(mockResponseData);
    expect(mockCallbacks[1]).toHaveBeenCalledWith(mockResponseData);
  });

  it(`rejectAll should throw error to all pending promises`, async () => {
    const error = new Error('error');
    await connect(client);
    const message1 = client.send(generateRequest());
    const message2 = client.send(generateRequest());

    client.rejectAll(error);
    await expect(message1).rejects.toEqual(error);
    await expect(message2).rejects.toEqual(error);
  });

  it(`resetInFlightPromises should erase all pending promises`, async () => {
    await connect(client);
    client.send(generateRequest());
    client.send(generateRequest());

    expect(_.size(client.inFlightPromises)).toBe(2);
    client.resetInFlightPromises();
    expect(_.size(client.inFlightPromises)).toBe(0);
  });

  async function connect(client) {
    const result = {};
    const promise = client.open();
    client.ws.onopen(result);
    await promise;
  }

  function generateRequest(message) {
    return {message: 'a message'};
  }

  function generateResponse(message, messageId) {
    return {
      data: JSON.stringify({
        type: message,
        response: message,
        messageId: messageId
      })
    };
  }
});
