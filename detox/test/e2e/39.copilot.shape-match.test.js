const PromptHandler = require('./copilot/PromptHandler');
const {describeForCopilotEnv} = require("./utils/custom-describes");

describeForCopilotEnv('Shape Match Game Screen', () => {
  beforeAll(async () => {
    await copilot.init(new PromptHandler());
    await copilot.perform('Launch the app');
  });

  it('should match blue square to its hole', async () => {
    await copilot.perform([
      'Enter the shapes-matching game screen',
      'Drag the blue square into the middle of its shape hole (square)',
      'Verify that the blue square is now in the middle of its hole',
    ]);
  });
});
