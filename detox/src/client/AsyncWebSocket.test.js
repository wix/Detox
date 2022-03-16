// @ts-nocheck
jest.useFakeTimers('modern');

const permaproxy = require('funpermaproxy');
const _ = require('lodash');

const config = require('../configuration/configurations.mock').validSession;

describe('AsyncWebSocket', () => {
  let AsyncWebSocket;
  let WebSocket;
  /**
   * @type {import('./AsyncWebSocket')}
   */
  let aws;
  let log;

  const socket = permaproxy(() => _.last(WebSocket.mock.instances));

  beforeEach(() => {
    jest.mock('../utils/logger');
    jest.mock('ws');
    WebSocket = require('ws');
    WebSocket.CONNECTING = 0;
    WebSocket.OPEN = 1;
    WebSocket.CLOSING = 2;
    WebSocket.CLOSED = 3;

    WebSocket.prototype.readyState = WebSocket.CONNECTING;
    WebSocket.prototype.mockOpen = function () {
      this.readyState = WebSocket.OPEN;
      this.onopen && this.onopen({ target: this });
    };
    WebSocket.prototype.mockError = function (error) {
      this.onerror && this.onerror({ error });
    };
    WebSocket.prototype.mockMessage = function (data) {
      this.onmessage && this.onmessage({ data: JSON.stringify(data) });
    };
    WebSocket.prototype.mockClose = function () {
      this.onclose && this.onclose(null);
    };
    WebSocket.prototype.mockCloseError = function (error) {
      this.close.mockImplementation(() => { throw error; });
    };

    AsyncWebSocket = require('./AsyncWebSocket');
    aws = new AsyncWebSocket(config.server);
    log = require('../utils/logger');
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  describe('.open()', () => {
    it(`should normally resolve`, async () => {
      await expect(connect()).resolves.not.toThrowError();
    });

    it(`should reject if called twice simultaneously`, async () => {
      const [, connectTwice] = [aws.open(), connect()];
      await expect(connectTwice).rejects.toThrowErrorMatchingSnapshot();
    });

    it(`should reject if called twice sequentially`, async () => {
      await connect();
      await expect(connect()).rejects.toThrowErrorMatchingSnapshot();
    });

    it(`should reject on a constructor error`, async () => {
      WebSocket.mockImplementation(() => { throw anError(); });
      await expect(connect()).rejects.toThrowErrorMatchingSnapshot();
    });

    it(`should reject on an error event`, async () => {
      const promise = aws.open();
      socket.mockError(anError());
      await expect(promise).rejects.toThrowErrorMatchingSnapshot();
    });

    it(`should allow to open a connection after an error`, async () => {
      const promise1 = aws.open();
      socket.mockError(anError());
      await expect(promise1).rejects.toThrowError();

      const promise2 = aws.open();
      socket.mockOpen();
      await expect(promise2).resolves.not.toThrowError();
    });
  });

  describe('.send()', () => {
    it(`should throw for a closed connection`, async () => {
      await expect(aws.send(generateRequest())).rejects.toThrowErrorMatchingSnapshot();
    });

    describe('when opened', () => {
      beforeEach(() => connect());

      it(`should mutate messages without .messageId by auto-incrementing it`, async () => {
        const expected1 = generateResponse('onmessage', 0);
        const request1 = generateRequest();
        const response1 = aws.send(request1);
        socket.mockMessage(expected1);
        expect(await response1).toEqual(expected1);
        expect(request1.messageId).toEqual(0);

        const expected2 = generateResponse('onmessage', 1);
        const request2 = generateRequest();
        const response2 = aws.send(request2);
        socket.mockMessage(expected2);
        expect(await response2).toEqual(expected2);
        expect(request2.messageId).toEqual(1);
      });

      it(`should not mutate an existing messageId in a message`, async () => {
        const expected1 = generateResponse('cleanupDone', -0xc1ea);

        const request1 = generateRequest(-0xc1ea);
        const response1 = aws.send(request1);
        socket.mockMessage(expected1);
        expect(await response1).toEqual(expected1);
      });

      it(`should not set expiration timers by default`, async () => {
        aws.send(generateRequest());
        expect(jest.getTimerCount()).toBe(0);
      });

      it(`should set an expiration timer if sent with timeout > 0`, async () => {
        aws.send(generateRequest(), { timeout: 100 });
        expect(jest.getTimerCount()).toBe(1);
      });

      it(`should reject all messages in the flight if there's an error`, async () => {
        const sendPromise1 = aws.send(generateRequest());
        socket.mockError(anError());

        await expect(sendPromise1).rejects.toThrowErrorMatchingSnapshot();
      });

      it(`should call an event handler when it matches the message type in the flight`, async () => {
        const onErrorCallback = jest.fn();
        const someResponse = generateResponse('error message', 100);
        someResponse.type = 'error';

        aws.setEventCallback('error', onErrorCallback);
        const sendPromise1 = aws.send(generateRequest(100));

        // we have one matching in-flight promise with messageId=100
        socket.mockMessage(someResponse);
        await expect(sendPromise1).resolves.toEqual(someResponse);
        expect(onErrorCallback).toHaveBeenCalledWith(someResponse);
        expect(onErrorCallback).toHaveBeenCalledTimes(1);

        // now there are no matching in-flight promises
        socket.mockMessage(someResponse);
        expect(onErrorCallback).toHaveBeenCalledTimes(2);
      });

      it(`should log an error if the incoming message was completely unexpected`, async () => {
        const onErrorCallback = jest.fn();
        aws.setEventCallback('error', onErrorCallback);
        socket.mockMessage({ type: 'somethingElse' });

        expect(onErrorCallback).not.toHaveBeenCalled();
        expect(log.error).toHaveBeenCalledWith(
          { event: 'WS_ERROR' },
          expect.stringMatching('Unexpected error')
        );

        const error = log.error.mock.calls[0][1];
        expect(error).toMatchSnapshot();
      });

      it(`should fail if the message timeout has expired`, async () => {
        const sendPromise = aws.send(generateRequest(), { timeout: 5000 });
        expect(jest.getTimerCount()).toBe(1);
        jest.advanceTimersByTime(5000);
        await expect(sendPromise).rejects.toThrowErrorMatchingSnapshot();
        expect(jest.getTimerCount()).toBe(0);
      });

      it(`should cancel the expiration timer if the request has been answered`, async () => {
        aws.send(generateRequest(100), { timeout: 5000 });
        expect(jest.getTimerCount()).toBe(1);
        socket.mockMessage({ messageId: 100, type: 'response' });
        expect(jest.getTimerCount()).toBe(0);
      });

      it(`should cancel the expiration timer if all in-flights have been reset`, async () => {
        aws.send(generateRequest(100), { timeout: 5000 });
        await aws.resetInFlightPromises();
        expect(jest.getTimerCount()).toBe(0);
      });

      it(`should cancel the expiration timer if all in-flights have been rejected`, async () => {
        const promise = aws.send(generateRequest(100), { timeout: 5000 });
        await aws.rejectAll(new Error('Just because'));
        expect(jest.getTimerCount()).toBe(0);
        await expect(promise).rejects.toThrow('Just because');
      });
    });
  });

  describe('.close()', () => {
    it('should silently exit if the socket is not open', async () => {
      await expect(aws.close()).resolves.not.toThrowError();
    });

    it('should close the socket when onclose is called', async () => {
      await connect();
      const closePromise = aws.close();
      socket.mockClose();
      await expect(closePromise).resolves.not.toThrowError();
    });

    it('should throw on a consequent attempt to close the socket', async () => {
      await connect();
      const closePromise1 = aws.close();
      const closePromise2 = aws.close();
      socket.mockClose();
      await expect(closePromise1).resolves.not.toThrowError();
      await expect(closePromise2).rejects.toThrowErrorMatchingSnapshot();
    });

    it('should throw on a sync socket.close() error', async () => {
      await connect();
      socket.mockCloseError(anError());
      await expect(aws.close()).rejects.toThrowErrorMatchingSnapshot();
    });

    it('should throw on an emitted socket.close() error', async () => {
      await connect();
      const closePromise = aws.close();
      socket.mockError(anError());
      await expect(closePromise).rejects.toThrowErrorMatchingSnapshot();
    });
  });

  describe('.isOpen', () => {
    it(`should return false when closed`, async () => {
      expect(aws.isOpen).toBe(false);
    });

    it(`should return true when opened`, async () => {
      await connect();
      expect(aws.isOpen).toBe(true);
    });
  });

  describe('.status', () => {
    it(`should return "non-initialized" at the beginning`, async () => {
      expect(aws.status).toBe('non-initialized');
    });

    it(`should return "opening" when connecting`, async () => {
      aws.open();
      socket.readyState = WebSocket.CONNECTING;
      expect(aws.status).toBe('opening');
    });

    it(`should return "open" when opened`, async () => {
      await connect();
      expect(aws.status).toBe('open');
    });

    it(`should return "closing" when closing`, async () => {
      aws.open();
      socket.readyState = WebSocket.CLOSING;
      expect(aws.status).toBe('closing');
    });

    it(`should return "closed" when closed`, async () => {
      aws.open();
      socket.readyState = WebSocket.CLOSED;
      expect(aws.status).toBe('closed');
    });
  });

  describe('.setEventCallback(type, event)', () => {
    it('should set as many callbacks as you want', async () => {
      const f1 = jest.fn();
      const f2 = jest.fn();
      aws.setEventCallback('foo', f1);
      aws.setEventCallback('foo', f2);

      await connect();
      const someMessage = { type: 'foo' };
      socket.mockMessage(someMessage);

      expect(f1).toHaveBeenCalledWith(someMessage);
      expect(f2).toHaveBeenCalledWith(someMessage);
    });
  });

  describe('.rejectAll()', () => {
    it(`should throw error for all pending promises`, async () => {
      await connect();
      const message1 = aws.send(generateRequest(0, 'invoke'));
      const message2 = aws.send(generateRequest(1, 'currentStatus', false));

      aws.rejectAll(anError('TestError'));
      await expect(message1).rejects.toThrow(/TestError/);
      await expect(message2).rejects.toThrow(/TestError/);
    });
  });

  describe('.resetInFlightPromises', () => {
    it(`should reset all pending promises`, async () => {
      await connect();
      aws.send(generateRequest(1, 'currentStatus', false));
      aws.send(generateRequest(2, 'currentStatus', false));

      expect(_.size(aws.inFlightPromises)).toBe(2);

      aws.resetInFlightPromises();

      expect(_.size(aws.inFlightPromises)).toBe(0);
    });

    it(`should handle late responses to aborted in-flight requests`, async () => {
      await connect();
      aws.send(generateRequest(1));
      aws.resetInFlightPromises();

      socket.mockMessage({ type: 'someReply', messageId: 1 });
      expect(log.debug).toHaveBeenCalledWith({ event: 'WS_LATE_RESPONSE' }, expect.stringContaining('messageId=1'));
    });
  });

  describe('pending interactions', () => {
    beforeEach(async () => {
      await connect();
    });

    const multipleInteractionsWarning = 'Detox has detected multiple interactions taking place simultaneously. ' +
      'Have you forgotten to apply an await over one of the Detox actions in your test code?';

    it('should throw on multiple pending requests that cannot be concurrent', async () => {
      const response1 = aws.send(generateRequest(1, 'invoke'));
      const response2 = aws.send(generateRequest(2, 'currentStatus', false));
      const response3 = aws.send(generateRequest(3, 'invoke'));

      socket.mockMessage(generateResponse('invokeDone', 1));
      socket.mockMessage(generateResponse('currentStatusDone', 2));
      socket.mockMessage(generateResponse('invokeDone', 3));

      await expect(response1).rejects.toThrow(multipleInteractionsWarning);
      await expect(response2).resolves.not.toThrow();
      await expect(response3).rejects.toThrow(multipleInteractionsWarning);
    });

    it('should not throw on multiple pending requests that be concurrent', async () => {
      const response1 = aws.send(generateRequest(1, 'invoke'));
      const response2 = aws.send(generateRequest(2, 'currentStatus', false));
      const response3 = aws.send(generateRequest(3, 'currentStatus', false));

      socket.mockMessage(generateResponse('invokeDone', 1));
      socket.mockMessage(generateResponse('currentStatusDone', 2));
      socket.mockMessage(generateResponse('currentStatusDone', 3));

      await expect(response1).resolves.not.toThrowError();
      await expect(response2).resolves.not.toThrowError();
      await expect(response3).resolves.not.toThrowError();
    });
  });

  describe('edge cases', () => {
    it('should close normally even when "close" comes from the event, not our intent', async () => {
      await connect();
      expect(aws.isOpen).toBe(true);
      await socket.mockClose();
      expect(aws.isOpen).toBe(false);
    });

    it('should elaborate about null-like messages', async () => {
      await connect();

      const response = aws.send(generateRequest());
      socket.onmessage({ data: null });

      const error = await response.then(() => {
        throw new Error('Assertion: the call should have failed');
      }, _.identity);
      delete error.stack;
      expect(error).toMatchSnapshot();
    });
  });

  function connect() {
    return Promise.race([
      aws.open(),
      new Promise(() => { socket.mockOpen(); }),
    ]);
  }


  function generateRequest(messageId, type = 'invoke', isAtomic = true) {
    return {
      type,
      message: 'a message',
      messageId,
      timeout: 0,
      isAtomic,
    };
  }

  function generateResponse(message, messageId) {
    return {
      type: message,
      response: message,
      messageId: messageId
    };
  }

  function anError(msg = 'TestError') {
    const err = new Error(msg);
    delete err.stack;
    return err;
  }
});
