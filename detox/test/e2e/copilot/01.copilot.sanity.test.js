describe.forCopilot('Copilot Sanity', () => {
  beforeEach(async () => {
    await copilot.perform(
      'Restart the React Native state',
      'Navigate to the Sanity screen'
    );
  });

  it('should have welcome screen', async () => {
    await copilot.perform(
      'Welcome text is displayed',
      'Say Hello button is visible to the user',
      'Can see a Say World button'
    );
  });

  it('should show hello screen after tap', async () => {
    await copilot.perform('Tap on Say Hello button', '"Hello!!!" text is visible');
  });

  it('should show world screen after tap', async () => {
    await copilot.perform('Tap on Say World button', '"World!!!" text is displayed');
  });
});
