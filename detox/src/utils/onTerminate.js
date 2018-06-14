const _ = require('lodash');

function onTerminate(callback) {
  process.on('SIGINT', _.once(callback));
  process.on('SIGTERM', _.once(callback));
}

module.exports = onTerminate;