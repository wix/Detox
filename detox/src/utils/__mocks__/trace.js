module.exports = {
  trace: {
    startSection: jest.fn(),
    endSection: jest.fn(),
  },
  traceCall: jest.fn().mockImplementation((_, fn) => fn()),
};
