const PromptHandler = require('./PromptHandler');
const {describeForCopilotEnv} = require("../utils/custom-describes");
const {expectToThrow} = require("../utils/custom-expects");

describeForCopilotEnv('System Dialogs', () => {
  beforeAll(async () => {
    await copilot.init(new PromptHandler());
  });

  describe(':ios: iOS Permission Dialogs', () => {
    beforeEach(async () => {
      await copilot.perform(
        'Start a fresh instance of the app',
        'Navigate to the System Dialogs screen'
      );
    });

    it('should handle permission request dialogs', async () => {
      await copilot.perform(
        'Check that the initial permission status is "denied"',
        'Tap the button to request permission',
        'A system dialog appears asking for permission',
        'Tap the "Allow" button on the system dialog',
        'Verify that the permission status now says "granted"',
        'Request permission again',
        'This time, tap the "Deny" button on the system dialog',
        'Confirm that the permission status shows "blocked"'
      );
    });

    it('should handle non-existent system elements', async () => {
      await expectToThrow(async () => {
        await copilot.perform('Interact with the system element with the text "Press Me"',);
      });
    });
  });
});

