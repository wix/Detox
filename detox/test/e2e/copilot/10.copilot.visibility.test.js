const { default: jestExpect } = require('expect');

describe.forCopilot('Visibility', () => {
  describe('Visibility Expectation', () => {
    beforeEach(async () => {
      await copilot.perform(
        'Restart the React Native state',
        'Navigate to the Visibility Expectation screen'
      );
    });

    describe('before move element', () => {
      it('should be truthy when at least 50% visibility is required', async () => {
        await copilot.perform(
          'Verify there is a text element with the text "Element should be half-visible"',
          'Verify the purple rectangle below the text that is exactly 50% visible',
        );
      });

      it('should be falsy when at least 51% visibility is required', async () => {
        await jestExpect(async () =>
          await copilot.perform('Verify the purple rectangle is 51% visible')
        ).rejects.toThrowError();
      });
    });

    describe('after move element', () => {
      beforeEach(async () => {
        await copilot.perform('Tap the button with the text "Move That Element"');
      });

      it('should be truthy when at least 25% visibility is required', async () => {
        await copilot.perform(
          'Verify the purple rectangle is exactly 25% visible',
        );
      });

      it('should be falsy when at least 26% visibility is required', async () => {
        await jestExpect(async () =>
          await copilot.perform('Verify the purple rectangle is exactly 26% visible')
        ).rejects.toThrowError();
      });
    });
  });
});
