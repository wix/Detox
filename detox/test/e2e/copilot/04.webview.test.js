const PromptHandler = require('./PromptHandler');
const {describeForCopilotEnv} = require("../utils/custom-describes");

describeForCopilotEnv('WebView Interactions', () => {
  beforeAll(async () => {
    await copilot.init(new PromptHandler());
    await copilot.perform('Start the app');
  });

  describe('Single WebView Tests', () => {
    beforeEach(async () => {
      await copilot.perform(
        'Restart the React Native state',
        'Navigate to the WebView screen'
      );
    });

    it('should interact with elements in a single WebView', async () => {
      await copilot.perform(
        'Find an element with ID "pageHeadline" in the WebView',
        'Verify that the text of this element is "First Webview"',
        'Locate an input field with ID "fname"',
        'Type "Tester" into this input field',
        'Confirm that the input field now contains the text "Tester"',
        'Find and click a submit button',
        'Check that the input field still contains "Tester"'
      );
    });

    it('should scroll and interact with elements', async () => {
      await copilot.perform(
        'Scroll to the bottom of the WebView to find an element with the id "bottomParagraph"',
        'Verify that this element is now visible'
      );
    });
  });

  describe('Multiple WebViews Tests', () => {
    beforeEach(async () => {
      await copilot.perform(
        'Navigate to the WebView screen',
        'Enable the second WebView'
      );
    });

    it('should interact with elements in multiple WebViews', async () => {
      await copilot.perform(
        'In the second WebView, find an element that contains the message "This is a dummy webview."',
        'Enable the third WebView',
        'There should be an iframe in the third WebView with the title "This is an iframe" or something similar'
      );
    });
  });
});
