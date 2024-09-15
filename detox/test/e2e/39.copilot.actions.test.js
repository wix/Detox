const PromptHandler = require('./copilot/PromptHandler');
const jestExpect = require('expect').default;

describe('Copilot Actions', () => {
  beforeAll(async () => {
    copilot.init(new PromptHandler());

    await copilot.perform('Start the application');
  });

  beforeEach(async () => {
    await copilot.perform('Restart the React Native environment');
    await copilot.perform('Go to the Actions screen');
  });

  it('should tap on an element', async () => {
    await copilot.perform('Press the "Tap Me" button');
    await copilot.perform('The text "Tap Working!!!" is shown on the screen');
  });

  it('should long press on an element', async () => {
    await copilot.perform('Perform a long press on the "Tap Me" button');
    await copilot.perform('The message "Long Press Working!!!" is displayed');
  });

  it('should long press with duration on an element', async () => {
    await copilot.perform('Hold the "Long Press Me 1.5s" button for 1.5 seconds');
    await copilot.perform('Can see "Long Press With Duration Working!!!" on the screen');
  });

  it('should long press with point', async () => {
    await copilot.perform('Long press the top left corner of the "Long Press on Top Left" button');
    await copilot.perform('The text "Long Press on Top Left Working!!!" appears');
  });

  it('should not succeed in long pressing with point outside the target area', async () => {
    await copilot.perform('Attempt a long press outside the "Long Press on Top Left" button');
    await copilot.perform('The message "Long Press on Top Left Working!!!" is not present');
  });

  it('should type in an element', async () => {
    const typedText = 'Type Working!!!';
    await copilot.perform(`Enter "${typedText}" into the text input field`);
    await copilot.perform(`The typed text "${typedText}" is visible on the screen`);
  });

  it('should press the backspace key on an element', async () => {
    const typedText = 'test';
    await copilot.perform(`Input "${typedText}x" in the text field`);
    await copilot.perform('Hit the backspace key in the text input');
    await copilot.perform(`The text "${typedText}" is shown in the input field`);
  });

  it('should press the return key on an element', async () => {
    await copilot.perform('Tap the return key on the keyboard for the text input');
    await copilot.perform('The message "Return Working!!!" is visible to the user');
  });

  it('should clear text in an element', async () => {
    await copilot.perform('Remove all text from the text input that already has text in it');
    await copilot.perform('The text "Clear Working!!!" appears on the screen');
  });

  it('should replace text in an element', async () => {
    await copilot.perform('Substitute the existing text with "replaced_text" in the test_id="UniqueId006" field');
    await copilot.perform('The message "Replace Working!!!" is shown');
  });

  it('should swipe down until pull to reload is triggered', async () => {
    await copilot.perform('Swipe fast the scrollable area ScrollView799 downwards until the refresh is activated');
    await copilot.perform('The text "PullToReload Working!!!" becomes visible');
  });

  it('should swipe vertically', async () => {
    await copilot.perform('The element with text "Text1" can be seen');
    await copilot.perform('Swipe the vertical scrollable area ScrollView161 upwards');
    await copilot.perform('The "Text1" element is no longer in view');
    await copilot.perform('Swipe the vertical area back down');
    await copilot.perform('"Text1" has reappeared on the screen');
  });

  it('should swipe horizontally', async () => {
    await copilot.perform('The "HText1" element is present');
    await copilot.perform('Swipe the horizontal scrollable area ScrollViewH towards the left');
    await copilot.perform('"HText1" is not in the visible area');
    await copilot.perform('Slide the horizontal scroll back to the right');
    await copilot.perform('The "HText1" element has come back into view');
  });

  it('should adjust slider and assert its value', async () => {
    await copilot.perform('The slider is set to 25%');
    await copilot.perform('Move the slider to the 75% position');
    await copilot.perform('The slider value is approximately 75%, give or take 10%');
  });

  it('should expect text fields to be focused after tap but not before', async () => {
    // This is not really the 1st / 2nd text fields in the screen, only in the test context.
    await copilot.perform('The text field UniqueId005 (call it "the first") does not have focus');
    await copilot.perform('Text input UniqueId006 (call it "the second") is not currently focused');

    // We expect the first input to be the one mentioned in the first step.
    await copilot.perform('Tap to focus on the first text field');

    await copilot.perform('First text field now has the focus');
    await copilot.perform('The second text input remains unfocused');
    await copilot.perform('Touch the second text field to give it focus');

    await copilot.perform('The first text input has lost focus');
    await copilot.perform('2nd text field is now the active input');
  });

  it('should assert on invalid intent', async () => {
    await jestExpect(async () =>
      await copilot.perform('Tap the "BLABLA" button')
    ).rejects.toThrowError();
  });

  it('should assert on ambiguous intent', async () => {
    await jestExpect(async () =>
      await copilot.perform('Hello world')
    ).rejects.toThrowError();
  });
});
