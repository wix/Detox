const { describeForCopilotEnv } = require('../utils/custom-describes');
const jestExpect = require('expect').default;

describeForCopilotEnv('Extend api catalog', () => {
  it('should run the new context', async () => {
    const dummyFunction = jest.fn();

    const newCategory = [{
      title: 'Dummies',
      items: [
        {
          signature: 'dummyFunction()',
          description: 'Calls a dummy function that does nothing but being called.',
          example: 'dummyFunction()'
        }
      ]
    }];

    copilot.extendAPICatalog(newCategory, { dummyFunction });

    await copilot.perform(
      'Call the dummyFunction()'
    );

    jestExpect(dummyFunction).toHaveBeenCalled();
  });
});
