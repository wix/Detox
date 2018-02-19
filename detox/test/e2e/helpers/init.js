const detox = require('detox');
const config = require('../../package.json').detox;
jest.setTimeout(480000);

beforeAll(async () => {
  await detox.init(config);
});