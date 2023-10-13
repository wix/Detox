const DetoxReporter = require('../jest/reporter');

test('DetoxReporter', () => {
  const reporter = new DetoxReporter({
    bail: 0,
    reporters: [['default', {}]],
  });

  expect(reporter.getLastError).toBeInstanceOf(Function);
  expect(reporter.onRunStart).toBeInstanceOf(Function);
  expect(reporter.onTestFileStart).toBeInstanceOf(Function);
  expect(reporter.onTestStart).toBeInstanceOf(Function);
  expect(reporter.onTestCaseStart).toBeInstanceOf(Function);
  expect(reporter.onTestCaseResult).toBeInstanceOf(Function);
  expect(reporter.onTestFileResult).toBeInstanceOf(Function);
  expect(reporter.onTestResult).toBeInstanceOf(Function);
  expect(reporter.onRunComplete).toBeInstanceOf(Function);
});
