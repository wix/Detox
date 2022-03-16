// @ts-nocheck
const net = require('net');

describe('DetoxServer', () => {
  let DetoxServer;
  let DetoxSessionManager;
  /** @type {DetoxServer} */
  let server;
  let options;
  let log;

  beforeEach(() => {
    jest.mock('../utils/logger');
    jest.mock('./DetoxSessionManager');
    log = require('../utils/logger');
    DetoxServer = require('./DetoxServer');
    DetoxSessionManager = require('./DetoxSessionManager');
  });

  afterEach(async () => {
    if (server) {
      await server.close();
    }
  });

  describe('.open() / .close()', () => {
    beforeEach(async () => {
      options = { port: 0 };
    });

    it('should start listening on specified port (on open) and stop (on close)', async () => {
      let port;

      try {
        server = new DetoxServer(options);
        await server.open();
        port = server.port;

        await expect(isPortBusy(port)).resolves.toBe(true);
      } finally {
        await server.close();
        await expect(isPortBusy(port)).resolves.toBe(false);
      }
    });

    it('should allow getting server port if it is running', async () => {
      try {
        server = new DetoxServer(options);
        expect(() => server.port).toThrowError(/Cannot get a port/);

        await server.open();
        expect(server.port).toBeGreaterThan(1023);
      } finally {
        await server.close();
        expect(() => server.port).toThrowError(/Cannot get a port/);
      }
    });

    it('should INFO log its port when started in standalone mode', async () => {
      try {
        options.standalone = true;
        server = new DetoxServer(options);
        await server.open();

        const expectedString = expect.stringContaining(`localhost:${server.port}`);
        expect(log.info).toHaveBeenCalledWith({ event: 'WSS_CREATE' }, expectedString);
        expect(log.debug).not.toHaveBeenCalledWith({ event: 'WSS_CREATE' }, expectedString);
      } finally {
        await server.close();
      }
    });

    it('should DEBUG log its port when started in a non-standalone mode', async () => {
      try {
        options.standalone = false;
        server = new DetoxServer(options);
        await server.open();

        const expectedString = expect.stringContaining(`localhost:${server.port}`);
        expect(log.debug).toHaveBeenCalledWith({ event: 'WSS_CREATE' }, expectedString);
        expect(log.info).not.toHaveBeenCalledWith({ event: 'WSS_CREATE' }, expectedString);
      } finally {
        await server.close();
      }
    });

    it('should DEBUG log a message upon closing the server', async () => {
      server = new DetoxServer(options);
      await server.open();
      await server.close();

      const expectedString = expect.stringContaining(`has been closed gracefully`);
      expect(log.debug).toHaveBeenCalledWith({ event: 'WSS_CLOSE' }, expectedString);
    });

    it('should throw upon an unsuccessful server opening', async () => {
      options = optionsWithMockServer((wss, _o, listening) => {
        listening.mockImplementation(() => {});

        wss.on.mockImplementation((event, callback) => {
          if (event === 'error') {
            setImmediate(() => callback(new TestError()));
          }
        });
      });

      server = new DetoxServer(options);
      await expect(server.open()).rejects.toThrowError('TEST_ERROR');
    });

    it('should WARN log a message upon unsuccessful server closing (timeout case)', async () => {
      jest.useFakeTimers('modern');

      options = optionsWithMockServer((wss) => {
        wss.close.mockImplementation(() => {});
      });

      server = new DetoxServer(options);
      await server.open();

      const closePromise = server.close();
      jest.advanceTimersByTime(10000);
      await closePromise;

      const expectedString = expect.stringContaining(`closed abruptly`);
      expect(log.warn).toHaveBeenCalledWith({ event: 'ERROR' }, expectedString);
      expect(log.warn.mock.calls[0][1]).toMatchSnapshot();
    });

    it('should WARN log a message upon unsuccessful server closing (rejection case)', async () => {
      options = optionsWithMockServer((wss) => {
        wss.close.mockImplementation(() => {
          throw new TestError();
        });
      });

      server = new DetoxServer(options);
      await server.open();
      await server.close();

      const expectedString = expect.stringContaining(`TEST_ERROR`);
      expect(log.warn).toHaveBeenCalledWith({ event: 'ERROR' }, expectedString);
      expect(log.warn.mock.calls[0][1]).toMatchSnapshot();
    });

    it('should WARN log a message upon unsuccessful server closing (error emit case)', async () => {
      options = optionsWithMockServer((wss) => {
        let errorCallback;

        wss.on.mockImplementation((type, callback) => {
          if (type === 'error') {
            errorCallback = callback;
          }
        });

        wss.close.mockImplementation(() => {
          errorCallback(new TestError());
        });
      });

      server = new DetoxServer(options);
      await server.open();
      await server.close();

      const expectedString = expect.stringContaining(`TEST_ERROR`);
      expect(log.warn).toHaveBeenCalledWith({ event: 'ERROR' }, expectedString);
      expect(log.warn.mock.calls[0][1]).toMatchSnapshot();
    });
  });

  it('should ERROR log messages from wss.Server', async () => {
    let errorCallback;

    options = optionsWithMockServer((wss) => {
      wss.on.mockImplementation((type, callback) => {
        if (type === 'error') {
          errorCallback = callback;
        }
      });
    });

    server = new DetoxServer(options);
    await server.open();
    errorCallback(new TestError());

    const expectedString = expect.stringContaining(`unhandled error`);
    expect(log.error).toHaveBeenCalledWith(expectedString);
    expect(log.error.mock.calls[0][0]).toMatchSnapshot();
  });

  it('should register an incoming connection in SessionManager', async () => {
    let connectionCallback;

    options = optionsWithMockServer((wss) => {
      wss.on.mockImplementation((type, callback) => {
        if (type === 'connection') {
          connectionCallback = callback;
        }
      });
    });

    server = new DetoxServer(options);
    await server.open();

    const fakeWs = {};
    const fakeRequest = { socket: {} };

    const sessionManager = DetoxSessionManager.mock.instances[0];
    expect(sessionManager.registerConnection).not.toHaveBeenCalled();
    connectionCallback(fakeWs, fakeRequest);
    expect(sessionManager.registerConnection).toHaveBeenCalledWith(fakeWs, fakeRequest.socket);
  });

  function optionsWithMockServer(callback) {
    const Server = jest.genMockFromModule('ws').Server;
    Server.mockImplementation(function(options, listening) {
      const mockListening = jest.fn().mockImplementation(listening);
      this.address.mockReturnValue({ port: 65534 });
      this.close.mockImplementation(callback => callback());
      const result = callback && callback.call(null, this, options, mockListening);
      mockListening();
      return result || this;
    });

    return { Server };
  }

  async function isPortBusy(port) {
    return new Promise((resolve, reject) => {
      const server = net.createServer();

      server.once('error', function(err) {
        if (err.code === 'EADDRINUSE') {
          resolve(true);
        } else {
          reject(err);
        }
      });

      server.once('listening', function() {
        server.close();
        resolve(false);
      });

      server.listen(port);
    });
  }

  class TestError extends Error {
    constructor() {
      super('TEST_ERROR');
      delete this.stack;
    }
  }
});
