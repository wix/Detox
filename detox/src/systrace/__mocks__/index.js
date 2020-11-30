class FakeSysTrace {
  constructor() {
    this.init = jest.fn();
    this.startSection = jest.fn();
    this.endSection = jest.fn();
  }
}
const systraceCall = jest.fn().mockImplementation((_, fn) => fn());

module.exports = {
  systrace: new FakeSysTrace(),
  systraceCall,
}
