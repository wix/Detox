describe('DatePicker', () => {
    beforeEach(async () => {
      await device.reloadReactNative();
      await element(by.text('DatePicker')).tap();
      await element(by.id('showDatePicker')).tap();
    });

    it(':ios: setColumnToValue should not work for a date picker', async () => {
      let failed = false;
      try {
        await element(by.id('datePicker')).setColumnToValue(1, "6");
        await element(by.id('datePicker')).setColumnToValue(2, "34");
        await expect(element(by.id('localTimeLabel'))).toHaveText('Time: 06:34');
      } catch(ex) {
        failed = true;
      }

      if(failed === false) {
        throw new Error('Test should have thrown an error, but did not');
      }
    });

    it(':ios: can select dates on a UIDatePicker', async () => {
      await element(by.id('datePicker')).setDatePickerDate('2019-02-06T05:10:00-08:00', "ISO8601");
      await expect(element(by.id('utcDateLabel'))).toHaveText('Date (UTC): Feb 6th, 2019');
      await expect(element(by.id('utcTimeLabel'))).toHaveText('Time (UTC): 1:10 PM');
    });

    it(':android: can select dates on a UIDatePicker', async () => {
      //rn-datepicker does not support testId's on android, so by.type is the only way to match the datepicker right now
      //@see https://github.com/react-native-datetimepicker/datetimepicker#view-props-optional-ios-only
      await element(by.type('android.widget.DatePicker')).setDatePickerDate('2019-02-06T05:10:00-08:00', "ISO8601");
      await element(by.text('OK')).tap();

      await waitFor(element(by.id('utcDateLabel'))).toHaveText('Date (UTC): Feb 6th, 2019').withTimeout(3000);
    });
});
