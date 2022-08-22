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

function traceCall(sectionName, promise, args = {}) {
  assert(sectionName,
    `must provide section name when calling \`traceCall\` with args: \n ${JSON.stringify(args)}`);

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
