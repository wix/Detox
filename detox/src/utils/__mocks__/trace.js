const traceCall = jest.fn().mockImplementation((_, fn) => fn());

function traceMethods(obj, cat, methodNames) {
  for (const name of methodNames) {
    const originalMethod = obj[name];

    obj[name] = function tracedMethod() {
      return traceCall({ cat, name }, originalMethod.apply.bind(originalMethod, obj, arguments));
    };
  }
}

module.exports = {
  trace: {
    startSection: jest.fn(),
    endSection: jest.fn(),
  },
  traceCall,
  traceMethods,
};
