const config = require('../schemes.mock').valid.session;

describe('client', () => {
  let WebScoket;
  let Client;
  let client;

  beforeEach(() => {
    jest.mock('npmlog');
    WebScoket = jest.mock('./AsyncWebSocket');
    Client = require('./client');
  });

  it(`new Client`, async () => {
    const promise = await connect();
    const ba = await promise;
    console.log(ba);
  });

  it(``, async () => {
    await connect();
  });

  async function connect() {
    client = new Client(config);
    client.ws.send.mockReturnValueOnce(``);
    return await client.connect();
  }
});

