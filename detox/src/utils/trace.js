/** @type {Detox.Tracer} */
const trace = require('../..').trace;
const traceCall = trace.bind(null);

function traceMethods(obj, cat, methodNames) {
  for (const name of methodNames) {
    const originalMethod = obj[name];

    obj[name] = function tracedMethod() {
      return traceCall({ cat, name }, originalMethod.apply.bind(originalMethod, obj, arguments));
    };
  }
}

module.exports = {
  trace,
  traceCall,
  traceMethods,
};
