const net = require('net');

const { isPortTaken } = require('./netUtils');

describe('Network utils', () => {
  let server;

  afterEach(done => {
    if (server) {
      server.close(done);
    } else {
      done();
    }
  });

  test('should identify a taken port', async () => {
    server = net.createServer();
    const portTaken = await new Promise(resolve => {
      server.listen(0, () => {
        resolve(server.address().port);
      });
    });

    await expect(isPortTaken(portTaken)).resolves.toEqual(true);
  });

  test('should identify an available port', async () => {
    server = net.createServer();
    const availablePort = await new Promise(resolve => {
      server.listen(0, () => {
        const port = server.address().port;
        server.close(() => {
          resolve(port);
          server = null;
        });
      });
    });

    await expect(isPortTaken(availablePort)).resolves.toEqual(false);
  });
});
