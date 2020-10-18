const _ = require('lodash');
const shellQuote = require('shell-quote');
const { autoEscape } = require('../../src/utils/shellUtils');

function quote(argv) {
  return argv.map(arg => autoEscape(arg)).join(' ');
}

function parse(str) {
  return _.chain('')
    .thru(() => shellQuote.parse(str, process.env))
    .map(arg => {
      if (_.isObject(arg)) {
        if (arg.op === 'glob') {
          return arg.pattern;
        }

        return null;
      }

      return arg;
    })
    .compact()
    .value();
}

module.exports = {
  parse,
  quote,
};
