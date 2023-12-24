const _ = require("lodash");
const driver = {
  navToLaunchArgsScreen: () => element(by.text('Launch Args')).tap(),

  assertPreconfiguredValues: (initArgs, expectedInitArgs) => {
    if (!_.isEqual(initArgs, expectedInitArgs)) {
      throw new Error(
        `Precondition failure: Preconfigured launch arguments (in detox.config.js) do not match the expected value.\n` +
        `Expected: ${JSON.stringify(expectedInitArgs)}\n` +
        `Received: ${JSON.stringify(initArgs)}`
      );
    }
  },

  assertLaunchArgs: async (expected, notExpected) => {
    if (expected) {
      for (const [key, value] of Object.entries(expected)) {
        await expect(element(by.id(`launchArg-${key}.name`))).toBeVisible();
        await expect(element(by.id(`launchArg-${key}.value`))).toHaveText(`${value}`);
      }
    }

    if (notExpected) {
      for (const key of notExpected) {
        await expect(element(by.id(`launchArg-${key}.name`))).not.toBeVisible();
      }
    }
  }
}

module.exports = {
  launchArgsDriver: driver,
};
