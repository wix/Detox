const jestExpect = require('expect').default;

// todo(new-arch): tests are failing
//     Test Failed: View “<RNDateTimePickerComponentView: 0x10c504080>” is not an instance of “UIDatePicker”
describe('DatePicker', () => {
  describe.each([
    ['ios', 'spinner', 2],
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
    ])('ISO 8601 format: %s', async (dateString, expectedUtcDate, expectedUtcTime) => {
      await setDate(dateString, 'ISO8601');
      await expect(element(by.id('utcDateLabel'))).toHaveText(`Date (UTC): ${expectedUtcDate}`);
      if (platform === 'ios') {
        await expect(element(by.id('utcTimeLabel'))).toHaveText(`Time (UTC): ${expectedUtcTime}`);
      }
    });

  });
});
