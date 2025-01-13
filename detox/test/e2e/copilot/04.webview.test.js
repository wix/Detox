describe.forCopilot('WebView Interactions', () => {
  beforeEach(async () => {
    await copilot.perform(
      'Restart the React Native state',
      'Navigate to the WebView screen'
    );
  });

  describe('Single WebView Tests', () => {
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
        'Scroll to "bottomParagraph" in the WebView',
        'Verify that the text of this element is "This is a bottom paragraph with class."',
      );
    });
  });

  describe('Multiple WebViews Tests', () => {
    beforeEach(async () => {
      await copilot.perform(
        'Enable the second WebView'
      );
    });

    it('should interact with elements in multiple WebViews', async () => {
      await copilot.perform(
        'In the second WebView, verify the headline has the message "This is a dummy webview."',
        'Hide the second WebView',
        'Show the 3rd WebView',
        'There should be an iframe in the third WebView with the title "This is an iframe" or something similar'
      );
    });
  });
});
