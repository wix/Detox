const { describeForCopilotEnv } = require('../utils/custom-describes');
const jestExpect = require('expect').default;

describeForCopilotEnv('Assertions', () => {
  beforeAll(async () => {
    await copilot.perform('Start the app');
  });

  beforeEach(async () => {
    await copilot.perform(
      'Restart the React Native state',
      'Navigate to the Assertions screen'
    );
  });

  describe('Assertion Tests', () => {
    it('should assert an element is visible (by text)', async () => {
      await copilot.perform(
        'Verify there is an element with the text "i contain some text"'
      );
    });

    it('should not assert an element is not visible (by text)', async () => {
      await jestExpect(async () =>
        await copilot.perform('Verify there is element with the text "I am full of text" in the screen')
      ).rejects.toThrowError();
    });

    it('should assert an element is visible (by id)', async () => {
      await copilot.perform(
        'Verify there is an element with ID "subtext-root"'
      );
    });

    it('should not assert an element that does not exist (by id)', async () => {
      await jestExpect(async () =>
        await copilot.perform('Find an element with ID "RandomJunk959" in the screen')
      ).rejects.toThrowError();
    });

    it('should assert an element has (accessibility) label', async () => {
      await copilot.perform(
        'Verify there is an element with the accessibility label "I contain some text"'
      );
    });

    it('should not assert an element that does not exist (by label)', async () => {
      await jestExpect(async () =>
        await copilot.perform('Find an element with label "I exist in the screen" in the screen')
      ).rejects.toThrowError();
    });

    it('assert toggle exist by element type', async () => {
      await copilot.perform(
        'Verify that the toggle type element is exist in the screen',
      );
    });

    // Note: This test is skipped because currently we don't know what are the exact expectations.
    // Should we expect the copilot to understand the similarity between toggle and checkbox or not?
    it.skip('shouldn`t assert an element that does not exist (by type)', async () => {
      await jestExpect(async () =>
        await copilot.perform('Find a Check-box type element in the screen')
      ).rejects.toThrowError();
    });

    it('shouldn`t assert an element that does not exist (by type, text-field)', async () => {
      await jestExpect(async () =>
        await copilot.perform('Find a text-field element in the screen')
      ).rejects.toThrowError();
    });

    it('assert toggle-switch widget false', async () => {
      await copilot.perform(
        'Verify that the toggle has false value',
      );

      await expect(element(by.id('toggle'))).toHaveToggleValue(false);
    });

    it('assert toggle-switch widget true ', async () => {
      await copilot.perform(
        'Tap the toggle',
        'Verify that the toggle has true value'
      );

      await expect(element(by.id('toggle'))).toHaveToggleValue(true);
    });

    it('assert details in image', async () => {
      await copilot.perform(
        'Verify there is an image element in the screen',
        'Verify there is a banana in the image element',
        'Verify there isn`t an apple in the image element',
        'Verify there are grapes in the image element',
      );
    });

    it('assert element`s color', async () => {
      await copilot.perform(
        'Verify there is a green text element'
      );
    });

    // Note: When removing "under the image element" the test failed, saying there is no blue text element in the screen, only pink and black.
    it.skip('assert element`s color with text contains another color', async () => {
      await copilot.perform(
        'Verify there is a blue text element under the image element in the screen'
      );
    });

    // Note: The test is skipped because of the order asserting problem in the ThrowError part.
    it.skip('assert elements are in specific order', async () => {
      await copilot.perform(
        // Note: only when adding the first line, the second line passed the test
        'Verify there is an element with the text "subtext"',
        'Verify that under the text element with the text "subtext" there is an image element',
        'Verify that under the image element there is a green text element',
        'Verify that under the green text element there is a toggle element',
      );

      await jestExpect(async () =>
        await copilot.perform('Verify the toggle element is above the text element')
      ).rejects.toThrowError();

      await jestExpect(async () =>
        await copilot.perform('Verify that under the image element in the screen there is text element with the text "subtext"')
      ).rejects.toThrowError();
    });

    // Note: The test is skipped because of the location asserting problem in the ThrowError part.
    it.skip('assert element`s position', async () => {
      await copilot.perform(
        'Verify there is a smiling emoji in the top left corner of the screen',
        'Verify there is a party emoji in the bottom right corner of the screen'
      );

      await jestExpect(async () =>
        await copilot.perform()
      ).rejects.toThrowError('Verify there is a smiling face emoji in the center of the screen');
    });
  });
});
