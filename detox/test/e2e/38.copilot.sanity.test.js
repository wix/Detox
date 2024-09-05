const PromptHandler = require('./copilot/PromptHandler');

describe('Copilot Sanity', () => {
  beforeAll(async () => {
    await copilot.init(new PromptHandler());

    await copilot.act('Launch the app');
  });

  beforeEach(async () => {
    await copilot.act('Reset react native state');
    await copilot.act('Navigate to sanity');
  });

  it('should have welcome screen', async () => {
    await copilot.assert('Welcome text is displayed');
    await copilot.assert('Say Hello button is visible to the user');
    await copilot.assert('Can see a Say World button');
  });

  it('should show hello screen after tap', async () => {
    await copilot.act('Tap on Say Hello button');
    await copilot.assert('"Hello!!!" text is visible');
  });

  it('should show world screen after tap', async () => {
    await copilot.act('Tap on Say World button');
    await copilot.assert('"World!!!" text is displayed');
  });
});
