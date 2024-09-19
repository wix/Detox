const PromptHandler = require('./copilot/PromptHandler');

describe('Login and Drag & Drop Screen', () => {
  beforeAll(async () => {
    await copilot.init(new PromptHandler());
    await copilot.perform('Launch the app');
  });

  it('should log in successfully and show drag & drop interface', async () => {
    await copilot.perform([
      'Navigate to the Login screen',
      'Verify that the username input field is visible',
      'Verify that the password input field is visible',
      'Verify that the login button is visible',
      'Enter "user123" into the username input field',
      'Enter "password123" into the password input field',
      'Tap the login button',
      'Verify that a success message is displayed',
      'Dismiss the message alert',
      'Drag the blue ball into the middle of the yellow square',
      'Verify the blue ball should now be in the middle of the yellow square',
    ]);
  });
});
