const isPromise = require('./isPromise');

function timely(fn, ms, rejectReason) {
  return function () {
    return new Promise((resolve, reject) => {
      const maybePromise = fn.apply(this, arguments);
      if (!isPromise(maybePromise)) {
        return resolve(maybePromise);
      }

      const handle = setTimeout(reject, ms, rejectReason);
      maybePromise.finally(() => clearTimeout(handle));
      maybePromise.then(resolve, reject).finally(() => clearTimeout(handle));
    });
  };
}

module.exports = timely;