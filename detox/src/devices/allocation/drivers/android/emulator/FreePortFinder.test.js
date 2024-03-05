const net = require('net');

const FreePortFinder = require('./FreePortFinder');

describe('FreePortFinder', () => {
  let finder;
  let server;

  beforeEach(() => {
    finder = new FreePortFinder();
  });

  afterEach(done => {
    if (server) {
      server.close(done);
    } else {
      done();
    }
  });

  test('should find a free port', async () => {
    const port = await finder.findFreePort();
    expect(port).toBeGreaterThanOrEqual(10000);
    expect(port).toBeLessThanOrEqual(20000);
    expect(port % 2).toBe(0);
    await expect(finder.isPortTaken(port)).resolves.toBe(false);
  });

  test('should identify a taken port', async () => {
    server = net.createServer();
    const portTaken = await new Promise(resolve => {
      server.listen(0, () => { // 0 means random available port
        resolve(server.address().port);
      });
    });

    await expect(finder.isPortTaken(portTaken)).resolves.toBe(true);
  });
});
