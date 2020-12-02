class Trace {
  constructor(timestampProviderFn = Date.now) {
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
    }
  }
}

const trace = new Trace();
async function traceCall(sectionName, func) {
  trace.startSection(sectionName);
  try {
    const result = await func();
    trace.endSection(sectionName, { success: true });
    return result;
  } catch (error) {
    trace.endSection(sectionName, { success: false, error: error.toString() });
    throw error;
  }
}

module.exports = {
  Trace,
  trace,
  traceCall,
};
