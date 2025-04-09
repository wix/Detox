const {expectToThrow} = require("../utils/custom-expects");

describe.forPilot(':ios: iOS Permission Dialogs', () => {
  beforeEach(async () => {
    await pilot.perform(
      'Remove the app and start a fresh instance',
      'Navigate to the System Dialogs screen'
    );
  });

  it('should handle permission request dialogs', async () => {
    await pilot.perform(
      'Check that the initial permission status is "denied"',
      'Tap the button to request permission',
      'A system dialog appears asking for permission',
      'Tap the "Allow" button on the system dialog',
      'Verify that the permission status now says "granted"'
    );
  });

  it('should handle permission request dialogs with different button types', async () => {
    await pilot.perform(
      'Tap on request permission',
      'Deny the permission request',
      'Verify that the permission status now says "blocked"'
    );
  });

  it('should handle non-existent system elements', async () => {
    await expectToThrow(async () => {
      await pilot.perform('Interact with the system element with the text "Press Me"',);
    });
  });
});

