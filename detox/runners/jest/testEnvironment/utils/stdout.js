const { EOL } = require('os');

function trace(message) {
  process.stdout.write(message);
}

function traceln(message) {
  if (message) {
    trace(message);
  }

  trace(EOL);
}

module.exports = {
  trace,
  traceln,
};
