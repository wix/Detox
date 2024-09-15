const PromptHandler = require('./copilot/PromptHandler');

describe('Copilot Actions', () => {
  beforeAll(async () => {
    await copilot.init(new PromptHandler());

    await copilot.act('Start the application');
  });

  beforeEach(async () => {
    await copilot.act('Restart the React Native environment');
    await copilot.act('Go to the Actions screen');
  });

  it('should tap on an element', async () => {
    await copilot.act('Press the "Tap Me" button');
    await copilot.assert('The text "Tap Working!!!" is shown on the screen');
  });

  it('should long press on an element', async () => {
    await copilot.act('Perform a long press on the "Tap Me" button');
    await copilot.assert('The message "Long Press Working!!!" is displayed');
  });

  it('should long press with duration on an element', async () => {
    await copilot.act('Hold the "Long Press Me 1.5s" button for 1.5 seconds');
    await copilot.assert('Can see "Long Press With Duration Working!!!" on the screen');
  });

  it('should long press with point', async () => {
    await copilot.act('Long press the top left corner of the "Long Press on Top Left" button');
    await copilot.assert('The text "Long Press on Top Left Working!!!" appears');
  });

  it('should not succeed in long pressing with point outside the target area', async () => {
    await copilot.act('Attempt a long press outside the "Long Press on Top Left" button');
    await copilot.assert('The message "Long Press on Top Left Working!!!" is not present');
  });

  it('should type in an element', async () => {
    const typedText = 'Type Working!!!';
    await copilot.act(`Enter "${typedText}" into the text input field`);
    await copilot.assert(`The typed text "${typedText}" is visible on the screen`);
  });

  it('should press the backspace key on an element', async () => {
    const typedText = 'test';
    await copilot.act(`Input "${typedText}x" in the text field`);
    await copilot.act('Hit the backspace key in the text input');
    await copilot.assert(`The text "${typedText}" is shown in the input field`);
  });

  it('should press the return key on an element', async () => {
    await copilot.act('Tap the return key on the keyboard for the text input');
    await copilot.assert('The message "Return Working!!!" is visible to the user');
  });

  it('should clear text in an element', async () => {
    await copilot.act('Remove all text from the clearable text input');
    await copilot.assert('The text "Clear Working!!!" appears on the screen');
  });

  it('should replace text in an element', async () => {
    await copilot.act('Substitute the existing text with "replaced_text" in the editable field');
    await copilot.assert('The message "Replace Working!!!" is shown');
  });

  it('should swipe down until pull to reload is triggered', async () => {
    await copilot.act('Drag the scrollable area downwards until the refresh is activated');
    await copilot.assert('The text "PullToReload Working!!!" becomes visible');
  });

  it('should swipe vertically', async () => {
    await copilot.assert('The element with text "Text1" can be seen');
    await copilot.act('Slide the vertical scrollable area upwards');
    await copilot.assert('The "Text1" element is no longer in view');
    await copilot.act('Scroll the vertical area back down');
    await copilot.assert('"Text1" has reappeared on the screen');
  });

  it('should swipe horizontally', async () => {
    await copilot.assert('The "HText1" element is present');
    await copilot.act('Swipe the horizontal scrollable area towards the left');
    await copilot.assert('"HText1" is not in the visible area');
    await copilot.act('Slide the horizontal scroll to the right');
    await copilot.assert('The "HText1" element has come back into view');
  });

  it('should adjust slider and assert its value', async () => {
    await copilot.assert('The slider is set to 25%');
    await copilot.act('Move the slider to the 75% position');
    await copilot.assert('The slider value is approximately 75%, give or take 10%');
  });

  it('should expect text fields to be focused after tap but not before', async () => {
    await copilot.assert('The first text field does not have focus');
    await copilot.assert('Text input 2 is not currently focused');
    await copilot.act('Tap to focus on the first text field');
    await copilot.assert('Text field 1 now has the focus');
    await copilot.assert('The second text input remains unfocused');
    await copilot.act('Touch the second text field to give it focus');
    await copilot.assert('The first text input has lost focus');
    await copilot.assert('Text field 2 is now the active input');
  });
});
