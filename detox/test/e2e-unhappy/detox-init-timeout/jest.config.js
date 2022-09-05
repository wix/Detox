const baseConfigModule = require(`../../../test/e2e/jest.config.js`);

module.exports = async () => {
  const baseConfig = await baseConfigModule();

  return {
    ...baseConfig,

    testEnvironment: require.resolve('./testEnvironment.js'),
    testMatch: ["<rootDir>/test/e2e-unhappy/detox-init-timeout/timeout.test.js"],
    testTimeout: 15000,
  };
};
