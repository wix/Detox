const traceCall = jest.fn().mockImplementation((_, fn) => {
  return typeof fn === 'function' ? fn() : fn;
});

module.exports = {
  trace: {
    startSection: jest.fn(),
    endSection: jest.fn(),
  },
  traceCall,
};
