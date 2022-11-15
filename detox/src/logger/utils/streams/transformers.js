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
      const results = fn(chunk, index++);
      // eslint-disable-next-line unicorn/no-array-method-this-argument
      results.forEach(pushThis, this);
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
