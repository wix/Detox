function isPromise(value) {
  return Promise.resolve(value) === value;
}

module.exports = isPromise;