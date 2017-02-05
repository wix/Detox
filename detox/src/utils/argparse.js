const argv = require('minimist')(process.argv.slice(2));

function getArgValue(key) {
  const value = argv[key];
  return value;
}

module.exports = {
  getArgValue
};
