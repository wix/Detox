const { default: jestExpect } = require('expect');

describe.skipIfNewArchOnIOS('DatePicker', () => {
  describe.forCopilot('Copilot', () => {
    beforeEach(async () => {
      await copilot.perform(
        'Restart the React Native state',
        'Navigate to the DatePicker screen'
      );
    });

    describe('DatePicker Tests', () => {

      // Note: when writing "Date (UTC):" instead of "Date (UTC): " copilot failed the test
      it('correct date and time', async () => {
        await copilot.perform(
          'Verify there is element with the text "Date (UTC): "',
          'Verify the element value of current date UTC July 1st 2023',
          'Verify there is element with the text "Time (UTC): "',
          'Verify there is element with the text "Time Local: "',
          'Verify "Time Local: " value is 7:30 pm'
        );
      });

      it('compact date picker', async () => {
        await copilot.perform(
          'Verify there is an element with the text "Compact Date Picker"',
          'Verify there is an element with today`s date at the bottom of the screen',
          'Set the date picker to September 9th, 2023'
        );
      });

      it('inline date picker', async () => {
        await copilot.perform(
          'Verify there is an element with the text "Compact Date Picker"',
          'Tap the element with the text "Compact Date Picker"',
          'Verify there is an element with the text "Inline Date Picker"',
          'Verify there is an element with today`s date at the bottom of the screen',
          'Set the date picker to September 9th, 2023'
        );
      });

      it('switch to spinner date picker', async () => {
        await copilot.perform(
          'Verify there is an element with the text "Compact Date Picker"',
          'Tap the element with the text "Compact Date Picker"',
          'Verify there is an element with the text "Inline Date Picker"',
          'Tap the element with the text "Inline Date Picker"',
          'Verify that there is slider element at the bottom of the screen',
          'Set the date picker to September 9th, 2023'
        );

        await jestExpect(async () =>
          await copilot.perform('Set the date picker`s first column to 10th, so the date will be September 10th, 2023')
        ).rejects.toThrowError();
      });
    });
  });
});
