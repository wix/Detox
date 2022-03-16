async function globalSetup() {
  const detox = require('detox');
  await detox.globalInit();
}

module.exports = globalSetup;
