const isInTimeoutTest = process.env.TIMEOUT_E2E_TEST === '1';

module.exports = {
  initTimeout: isInTimeoutTest ? 30000 : 300000,
  testTimeout: 120000,
};