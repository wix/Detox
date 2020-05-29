const isPromise = require('./isPromise');

function timely(fn, ms, rejectReason) {
  return function () {
    return new Promise((resolve, reject) => {
      const maybePromise = fn(...arguments);
      if (!isPromise(maybePromise)) {
        return resolve(maybePromise);
      }

      const promise = maybePromise;
      const handle = setTimeout(reject, ms, rejectReason);
      promise.finally(() => clearTimeout(handle));
      promise.then(resolve, reject);
    });
  };
}

module.exports = timely;
