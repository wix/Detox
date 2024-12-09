const {describeForCopilotEnv} = require("../utils/custom-describes");

describeForCopilotEnv('Copilot Sanity', () => {
  beforeAll(async () => {
    await copilot.perform('Launch the app');
  });

  beforeEach(async () => {
    await copilot.perform('Reset react native state', 'Navigate to sanity');
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
