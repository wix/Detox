const argv = require('minimist')(process.argv.slice(2));

function getArgValue(key) {
  return argv[key];
}

module.exports = {
  getArgValue
};
