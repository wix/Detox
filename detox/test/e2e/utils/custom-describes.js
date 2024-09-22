// Custom describe functions to run tests only when Copilot is available on the environment
describeForCopilotEnv = (description, fn) => {
  if (process.env.COPILOT_IS_ENABLED === 'true') {
    describe(description, fn);
  } else {
    describe.skip(description, fn);
  }
}

module.exports = {
  describeForCopilotEnv,
};
