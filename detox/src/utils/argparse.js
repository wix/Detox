const argv = require('minimist')(process.argv.slice(2));

function getArgValue(key) {
  const value = argv ? argv[key] : undefined;
  return value;
}

module.exports = {
  getArgValue
};
