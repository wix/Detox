const assert = require('assert');

const TIMELINE_CONTEXT_TYPES = require('../artifacts/timeline/TimelineContextTypes');

class Trace {
  constructor() {
    this.events = [];
  }

  init(timestampProviderFn = Date.now) {
    this._timestampProviderFn = timestampProviderFn;
    this.events = [
      this._event('init'),
    ];
  }

  startSection(name, args) {
    this.events.push(this._event('start', name, args));
  }

  endSection(name, args) {
    this.events.push(this._event('end', name, args));
  }

  reset() {
    this.events = [
      this._event('init'),
    ];
  }

  _event(type, name, args) {
    return {
      type,
      ts: this._timestampProviderFn(),
      name,
      args,
    };
  }
}

let trace = new Trace();

/**
 * Trace a single call, with a given name and arguments.
 * @param sectionName The name of the section to trace.
 * @param promiseOrFunction {Promise|Function} Promise or a function that provides a promise.
 * @param args {Object} Optional arguments to pass to the trace.
 * @returns {any} The returned value of the traced call.
 *
 * @see https://wix.github.io/Detox/docs/next/api/detox-object-api/#detoxtracecall.
 */
function traceCall(sectionName, promiseOrFunction, args = {}) {
  assert(sectionName,
    `must provide section name when calling \`traceCall\` with args: \n ${JSON.stringify(args)}`);

  const promise = typeof promiseOrFunction === 'function' ? promiseOrFunction() : promiseOrFunction;

  trace.startSection(sectionName, args);
  return promise
    .then((result) => {
      trace.endSection(sectionName, { ...args, success: true });
      return result;
    })
    .catch((error) => {
      trace.endSection(sectionName, { ...args, success: false, error: error.toString() });
      throw error;
    });
}

function traceInvocationCall(sectionName, invocation, promise) {
  return traceCall(
    sectionName, promise, {
      context: TIMELINE_CONTEXT_TYPES.INVOCATION,
      stackTrace: _getCallStackTrace(),
      invocation: JSON.stringify(invocation),
    });
}

function _getCallStackTrace() {
  return new Error().stack
    .split('\n')
    .slice(1) // Ignore Error message
    .map(line => line
      .replace(/^\s*at\s+/, '')
      .replace(process.cwd(), '')
    )
    .filter(line => !line.includes('/detox/src')) // Ignore detox internal calls
    .join('\n');
}

module.exports = {
  Trace,
  trace,
  traceCall,
  traceInvocationCall
};
