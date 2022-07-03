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

function flatMapTransform(fn) {
  let index = 0;

  return new Transform({
    objectMode: true,
    transform(chunk, encoding, callback){
      const result = fn(chunk, index++);
      if (Array.isArray(result)) {
        // eslint-disable-next-line unicorn/no-array-method-this-argument
        result.forEach(pushThis, this);
      } else if (result) {
        this.push(result);
      }

      callback();
    },
  });
}

function pushThis(x) {
  return this.push(x);
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
  flatMapTransform,
  passErrorsTo,
};
