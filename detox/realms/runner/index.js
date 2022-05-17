const NullLogger = require('../../src/logger/NullLogger');
const log = new NullLogger();

module.exports = {
  DetoxReporter: require('./reporters/DetoxReporter'),
  log,
};
