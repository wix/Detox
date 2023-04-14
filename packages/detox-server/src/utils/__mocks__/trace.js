module.exports = {
  trace: {
    startSection: jest.fn(),
    endSection: jest.fn(),
    invocationCall: jest.fn().mockImplementation((_1, _2, promise) => promise),
  },
  traceCall: jest.fn().mockImplementation((_, fn) => {
    return typeof fn === 'function' ? fn() : fn;
  }),
};
