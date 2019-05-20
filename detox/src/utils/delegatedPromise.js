module.exports = function() {
  let resolveFn;
  let rejectFn;

  const promise = new Promise((resolve, reject) => {
    resolveFn = resolve;
    rejectFn = reject;
  });
  promise.resolve = resolveFn;
  promise.reject = rejectFn;
  return promise;
};
