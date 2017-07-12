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

//process.on('uncaughtException', (err) => {
//  //client.close();
//
//  throw err;
//});
//
//process.on('unhandledRejection', (reason, p) => {
//  throw reason;
//});

module.exports = {
  init,
  cleanup
};
