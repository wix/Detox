class FakeTrace {
  constructor() {
    this.init = jest.fn();
    this.startSection = jest.fn();
    this.endSection = jest.fn();
    this.events = [];
  }
}

const traceCall = jest.fn().mockImplementation((__, promise) => promise);

module.exports = {
  trace: new FakeTrace(),
  traceCall,
};
