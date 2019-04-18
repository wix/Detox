const detox = require('detox');
const config = require('../package.json').detox;

module.exports = async () => {
  await detox.init(config);
};
