/** @type {Detox.Tracer} */
const trace = require('../..').trace;

module.exports = {
  trace,
  traceCall: trace.bind(null),
};
