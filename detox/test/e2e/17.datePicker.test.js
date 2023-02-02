const jestExpect = require('expect').default;

describe('DatePicker', () => {
  describe.each([
    ['ios', 'compact', 0],
    ['ios', 'inline', 1],
    ['ios', 'spinner', 2],
    ['android', 'calendar', 0],
    ['android', 'spinner', 1],
  ])(`:%s: %s mode`, (platform, mode, toggleTimes) => {
    beforeEach(async () => {
      if (platform === 'ios') {
        await device.reloadReactNative();
      } else {
        // Android: Native date selector doesn't disappear if we just reloadReactNative() after an error
        await device.launchApp({newInstance: true});
      }

      await element(by.text('DatePicker')).tap();
    });

    beforeEach(async () => {
      for (let i = 0; i < toggleTimes; i++) {
        await element(by.id('toggleDatePicker')).tap();
      }
    });

    async function setDate(dateString, dateFormat) {
      if (platform === 'ios') {
        await element(by.id('datePicker')).setDatePickerDate(dateString, dateFormat);
      } else {
        await element(by.id('openDatePicker')).tap();

        // rn-datepicker does not support testId's on android, so by.type is the only way to match the datepicker view ATM
        // @see https://github.com/react-native-datetimepicker/datetimepicker#view-props-optional-ios-only
        await element(by.type('android.widget.DatePicker')).setDatePickerDate(dateString, dateFormat);
        await element(by.text('OK')).tap();
      }
    }

    test.each([
      ['2019-02-06T05:10:00-08:00', 'Feb 6th, 2019', '1:10 PM'],
      ['2019-02-06T05:10:00.435-08:00', 'Feb 6th, 2019', '1:10 PM'],
      // This case is important because Date.toISOString() doesn't output a TZ (assumes UTC 0)
      ['2023-01-11T10:41:26.912Z', 'Jan 11th, 2023', '10:41 AM'],
    ])('ISO 8601 format: %s', async (dateString, expectedUtcDate, expectedUtcTime) => {
      await setDate(dateString, 'ISO8601');
      await expect(element(by.id('utcDateLabel'))).toHaveText(`Date (UTC): ${expectedUtcDate}`);
      if (platform === 'ios') {
        await expect(element(by.id('utcTimeLabel'))).toHaveText(`Time (UTC): ${expectedUtcTime}`);
      }
    });

    test.each([
      ['yyyy/MM/dd HH:mm', '2019/02/06 13:10', 'Feb 6th, 2019', '1:10 PM'],
    ])('custom format: %s', async (dateFormat, dateString, expectedLocalDate, expectedLocalTime) => {
      await setDate(dateString, dateFormat);
      await expect(element(by.id('localDateLabel'))).toHaveText(`Date (Local): ${expectedLocalDate}`);
      if (platform === 'ios') {
        await expect(element(by.id('localTimeLabel'))).toHaveText(`Time (Local): ${expectedLocalTime}`);
      }
    });

    // Spinner-specific tests
    if (platform !== 'ios' || mode !== 'spinner') return;

    it('setColumnToValue should not work for a spinner date picker', async () => {
      const invalidAction = element(by.id('datePicker')).setColumnToValue(1, "6");
      await jestExpect(invalidAction).rejects.toThrow(/is not an instance of.*UIPickerView/);
    });
  });
});
