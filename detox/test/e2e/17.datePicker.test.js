const jestExpect = require('expect').default;

describe('DatePicker', () => {
  beforeEach(async () => {
    await device.reloadReactNative();
    await element(by.text('DatePicker')).tap();
  });

  describe.each([
    ['ios', 'compact', 0],
    ['ios', 'inline', 1],
    ['ios', 'spinner', 2],
    ['android', 'calendar', 0],
    ['android', 'spinner', 1],
  ])(`:%s: %s mode`, (platform, mode, times) => {
    beforeEach(async () => {
      for (let i = 0; i < times; i++) {
        await element(by.id('toggleDatePicker')).tap();
      }
    });

    test.each([
      ['ISO8601', new Date(2019, 1, 6, 14, 10, 0).toISOString()],
      ['yyyy/MM/dd HH:mm', '2019/02/06 14:10'],
    ])('can select dates in %j format', async (formatString, dateString) => {
      if (platform === 'ios') {
        await element(by.id('datePicker')).setDatePickerDate(dateString, formatString);
        await expect(element(by.id('localDateLabel'))).toHaveText('Date (Local): Feb 6th, 2019');
        await expect(element(by.id('localTimeLabel'))).toHaveText('Time (Local): 2:10 PM');
      } else {
        await element(by.id('openDatePicker')).tap();
        //rn-datepicker does not support testId's on android, so by.type is the only way to match the datepicker right now
        //@see https://github.com/react-native-datetimepicker/datetimepicker#view-props-optional-ios-only
        await element(by.type('android.widget.DatePicker')).setDatePickerDate('2019-02-06T05:10:00-08:00', 'ISO8601');
        await element(by.text('OK')).tap();

        await waitFor(element(by.id('utcDateLabel'))).toHaveText('Date (UTC): Feb 6th, 2019').withTimeout(3000);
      }
    });

    // Spinner-specific tests
    if (platform !== 'ios' || mode !== 'spinner') return;

    it('setColumnToValue should not work for a date picker', async () => {
      const invalidAction = element(by.id('datePicker')).setColumnToValue(1, "6");
      await jestExpect(invalidAction).rejects.toThrow(/is not an instance of.*UIPickerView/);
    });
  });
});
