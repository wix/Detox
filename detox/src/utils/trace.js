const { log, trace, traceCall } = require('../..');

function traceMethods(obj, cat, methodNames) {
  for (const name of methodNames) {
    const originalMethod = obj[name];

    obj[name] = function tracedMethod() {
      return log.trace.complete(
        { cat, arguments },
        name,
        originalMethod.apply.bind(originalMethod, obj, arguments)
      );
    };
  }
}

module.exports = {
  trace,
  traceCall,
  traceMethods,
};
