const argv = require('minimist')(process.argv.slice(2));

function getArgValue(key) {
  return (argv && argv[key]) ? argv[key] : process.env[key];
}

module.exports = {
  getArgValue
};
