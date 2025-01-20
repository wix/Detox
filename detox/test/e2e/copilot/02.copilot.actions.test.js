const jestExpect = require('expect').default;

describe.forCopilot('Copilot Actions', () => {
  beforeEach(async () => {
    await copilot.perform(
      'Restart the React Native environment',
      'Go to the Actions screen'
    );
  });

  it('should tap on an element', async () => {
    await copilot.perform(
      'Press the "Tap Me" button',
      'The text "Tap Working!!!" is shown on the screen'
    );
  });

  it('should long press on an element', async () => {
    await copilot.perform(
      'Perform a long press on the "Tap Me" button',
      'The message "Long Press Working!!!" is displayed'
    );
  });

  it('should long press with duration on an element', async () => {
    await copilot.perform(
      'Hold the "Long Press Me 1.5s" button for 1.5 seconds',
      'Can see "Long Press With Duration Working!!!" on the screen'
    );
  });

  it('should long press with point', async () => {
    await copilot.perform(
      'Long press the top-most left-most corner of the "Long Press on Top Left" button',
      'The text "Long Press on Top Left Working!!!" appears'
    );
  });

  it('should not succeed in long pressing with point outside the target area', async () => {
    await jestExpect(async () =>
      await copilot.perform('Attempt a long press on the "Long Press on Top Left" button outside its bounds')
    ).rejects.toThrowError();
  });

  it('should type in an element', async () => {
    await copilot.perform(
      'Enter "Type Working!!!" into the text input field',
      'The typed text is visible on the screen'
    );
  });

  it('should press the backspace key on an element', async () => {
    await copilot.perform(
      'Input "test" in the text field',
      'Hit the backspace key in the text input',
      'The typed text is shown in the input field'
    );
  });

  it('should press the return key on an element', async () => {
    await copilot.perform(
      'Tap the return key on the keyboard for the text input',
      'The message "Return Working!!!" is visible to the user'
    );
  });

  it('should clear text in an element', async () => {
    await copilot.perform(
      'Remove all text from the text input that already has text in it',
      'The text "Clear Working!!!" appears on the screen'
    );
  });

  it('should replace text in an element', async () => {
    await copilot.perform(
      'Substitute the existing text with "replaced_text" in the test_id="UniqueId006" field',
      'The message "Replace Working!!!" is shown'
    );
  });

  it('should swipe down until pull to reload is triggered', async () => {
    await copilot.perform(
      'Swipe fast the scrollable area ScrollView799 downwards to activate the pull-to-reload',
      'The text "PullToReload Working!!!" becomes visible'
    );
  });

  it('should swipe vertically', async () => {
    await copilot.perform(
      'The element with text "Text1" can be seen',
      'Swipe the view "ScrollView161" upwards',
      'The Text1 element is no longer in view',
      'Swipe the element back up until the "Text1" element is visible',
    );
  });

  it('should swipe horizontally', async () => {
    await copilot.perform(
      'The "HText1" element is present',
      // To avoid confusion: left swipe scrolls right
      'Left-swipe the horizontal scrollable area "ScrollViewH"',
      '"HText1" is not in the visible area',
      'Swipe the horizontal scroll back to the left',
      'The "HText1" element has come back into view'
    );
  });

  it('should adjust slider and assert its value', async () => {
    await copilot.perform(
      'The slider is set to 25%',
      'Move the slider to the 75% position',
      'The slider value is approximately 75%, give or take 10%'
    );
  });

  it('should expect text fields to be focused after tap but not before', async () => {
    await copilot.perform(
      'The text field UniqueId005 (call it "the first") does not have focus',
      'Text input UniqueId006 (call it "the second") is not currently focused',
      'Tap to focus on the first text field',
      'First text field now has the focus',
      'The second text input remains unfocused',
      'Touch the second text field to give it focus',
      'The first text input has lost focus',
      '2nd text field is now the active input'
    );
  });

  it('should assert on invalid intent', async () => {
    await jestExpect(async () =>
      await copilot.perform('Tap the "FOOBAR" button')
    ).rejects.toThrowError();
  });

  it('should assert on ambiguous intent', async () => {
    await jestExpect(async () =>
      await copilot.perform('Do magic to the element')
    ).rejects.toThrowError();
  });
});
