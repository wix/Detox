require('babel-polyfill');
const detox = require('detox');
const {After, Before} = require('cucumber');
const config = require('../../package.json').detox;

Before(async () => {
  await detox.init(config);
});

After(async () => {
  await detox.cleanup();
});