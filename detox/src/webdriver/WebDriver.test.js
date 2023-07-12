jest.unmock('proper-lockfile');
jest.unmock('signal-exit');
jest.unmock('../logger/DetoxLogger');

const { WebDriverServer } = require('./WebDriver');

let server;

beforeAll(async () => {
  server = new WebDriverServer({
    port: 4723,
  });

  await server.startServer();
});

test('WebDriverServer', (done) => {
  // never done
}, 300000);

afterAll(async () => {
  await server.stopServer();
});

