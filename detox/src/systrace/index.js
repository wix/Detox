// TODO unit test
class SysTrace {
  constructor() {
    this.startSection = () => { throw new Error('Not initialized!') }
    this.endSection = () => { throw new Error('Not initialized!') }
  }

  init(chromeTracing) {
    this.chromeTracing = chromeTracing;
    this.startSection = (name, args) => this.chromeTracing.beginEvent(name, args);
    this.endSection = (name, args) => this.chromeTracing.finishEvent(name, args);
  }

  toArtifactExport(append) {
    const prefix = (append ? ',' : '[');
    return this.chromeTracing.traces({prefix})
  }
}

const systrace = new SysTrace();
async function systraceCall(sectionName, func) {
  systrace.startSection(sectionName);
  try {
    const result = await func();
    systrace.endSection(sectionName, { success: true });
    return result;
  } catch (error) {
    systrace.endSection(sectionName, { success: false, error: error.toString() });
    throw error;
  }
}

module.exports = {
  systrace,
  systraceCall,
};
