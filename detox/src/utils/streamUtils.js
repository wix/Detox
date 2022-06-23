const { Transform } = require('stream');

function mapTransform(fn) {
  return new Transform({
    objectMode: true,
    transform(chunk, encoding, callback){
      this.push(fn(chunk));
      callback();
    },
  });
}

function passErrorsTo(output) {
  const reemitError = (err) => output.emit('error', err);
  return (input) => input.on('error', reemitError);
}

function combine(readable, writable) {
  passErrorsTo(writable)(readable);
  readable.pipe(writable);
  return { input: readable, output: writable };
}

module.exports = {
  combine,
  mapTransform,
  passErrorsTo,
};
