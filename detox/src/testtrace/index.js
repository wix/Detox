// TODO unit test
class TestTrace {
  constructor() {
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

  _event(type, name, args) {
    return {
      type,
      ts: Date.now(),
      name,
      args,
    }
  }
}

const trace = new TestTrace();
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
  trace,
  traceCall,
};
