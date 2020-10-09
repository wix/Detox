const { autoEscape } = require('../../src/utils/shellUtils');

function quote(argv) {
  return argv.map(arg => autoEscape(arg)).join(' ');
}

module.exports = {
  quote,
};
