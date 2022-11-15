const { PassThrough, Transform } = require('stream');

function through() {
  return new PassThrough({ objectMode: true });
}

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

module.exports = {
  through,
  mapTransform,
  flatMapTransform,
};
