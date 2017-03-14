const Detox = require('./Detox');

let detox;

async function init(config) {
  detox = new Detox(config);
  await detox.init();
}

async function cleanup() {
  if (detox) {
    await detox.cleanup();
  }
}

//// if there's an error thrown, close the websocket,
//// if not, mocha will continue running until reaches timeout.
//process.on('uncaughtException', (err) => {
//  //client.close();
//
//  throw err;
//});
//
//process.on('unhandledRejection', (reason, p) => {
//  //client.close();
//
//  throw reason;
//});

module.exports = {
  init,
  cleanup
};
