const argv = require('minimist')(process.argv.slice(2));

function getArgValue(key) {
  let value;

  if (argv && argv[key]) {
    value = argv[key];
  } else {
    const camelCasedKey = key.replace(/(\-\w)/g, (m) => m[1].toUpperCase());
    value = process.env[camelCasedKey];
    if (value === 'undefined') {
      value = undefined;
    }
  }

  return value;
}

module.exports = {
  getArgValue
};
