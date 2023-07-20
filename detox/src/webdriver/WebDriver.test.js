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
  console.log('WebDriverServer listening on port 4723');
});

test('WebDriverServer', (done) => {
  // never done
}, 300000);

afterAll(async () => {
  await server.stopServer();
});

