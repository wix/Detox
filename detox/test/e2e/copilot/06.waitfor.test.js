const {expectToThrow} = require("../utils/custom-expects");

describe.forCopilot('WaitFor Functionality', () => {
  beforeEach(async () => {
    await copilot.perform(
      'Restart the React Native environment',
      'Navigate to the WaitFor screen'
    );
  });

  it('should wait for elements to appear and disappear', async () => {
    await copilot.perform(
      'Verify that an element with ID "changeExistenceByToggle" is not present',
      'Tap the "Go" button',
      'Wait for the element to appear',
      'Confirm that the element is now visible',
      'Tap the "Go" button again',
      'Wait for the element to disappear',
      'Verify that the element is no longer present'
    );
  });

  it('should wait for elements to become focused and unfocused', async () => {
    await copilot.perform(
      'Check that an element with ID "changeFocusByToggle" is not focused',
      'Tap the "Go" button',
      'Wait for the element to become focused',
      'Verify that the element is now focused',
      'Tap the "Go" button again',
      'Wait for the element to lose focus',
      'Confirm that the element is no longer focused'
    );
  });

  it('should find elements by scrolling', async () => {
    await copilot.perform(
      'Verify that an element with text "Text5" is not visible',
      'Tap the "Go" button',
      'Scroll down in the ScrollView until "Text5" becomes visible',
      'Confirm that "Text5" is now visible on the screen'
    );
  });

  it('should handle timeouts for non-appearing elements', async () => {
    await expectToThrow(async () => {
      await copilot.perform(
        'Try to wait for an element with ID "neverAppearingText" to appear, with timeout of 2 seconds'
      );
    });
  });
});
