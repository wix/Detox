function traceMethods(logger, obj, methodNames) {
  for (const name of methodNames) {
    const originalMethod = obj[name];

    obj[name] = function tracedMethod(...args) {
      return logger.trace.complete(
        { args },
        name,
        originalMethod.apply.bind(originalMethod, obj, args)
      );
    };
  }
}

module.exports = traceMethods;
