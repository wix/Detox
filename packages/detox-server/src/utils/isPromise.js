function isPromise(value) {
  return Promise.resolve(value) === value;
}

function isPromiseLike(value) {
  return value ? typeof value.then === 'function' : false;
}

module.exports = {
  isPromise,
  isPromiseLike,
};
