const PromptHandler = require('./copilot/PromptHandler');
const {describeForCopilotEnv} = require("./utils/custom-describes");

describeForCopilotEnv('Copilot Sanity', () => {
  beforeAll(async () => {
    await copilot.init(new PromptHandler());

    await copilot.perform('Launch the app');
  });

  beforeEach(async () => {
    await copilot.perform('Reset react native state');
    await copilot.perform('Navigate to sanity');
  });

  it('should have welcome screen', async () => {
    await copilot.perform('Welcome text is displayed');
    await copilot.perform('Say Hello button is visible to the user');
    await copilot.perform('Can see a Say World button');
  });

  it('should show hello screen after tap', async () => {
    await copilot.perform('Tap on Say Hello button');
    await copilot.perform('"Hello!!!" text is visible');
  });

  it('should show world screen after tap', async () => {
    await copilot.perform('Tap on Say World button');
    await copilot.perform('"World!!!" text is displayed');
  });
});
