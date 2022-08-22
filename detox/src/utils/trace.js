const assert = require('assert');

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

module.exports = {
  Trace,
  trace,
  traceCall,
};
