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

    for (const [dateString, formatString] of [
      ['2019-02-06T05:10:00-08:00', 'ISO8601'], 
      ['2019/02/06 14:10', 'yyyy/MM/dd HH:mm']]
    ) {
      it(':ios: can select dates on a UIDatePicker, format: ' + formatString, async () => {
        await element(by.id('datePicker')).setDatePickerDate(dateString, formatString);
        await expect(element(by.id('localDateLabel'))).toHaveText('Date (Local): Feb 6th, 2019');
        await expect(element(by.id('localTimeLabel'))).toHaveText('Time (Local): 2:10 PM');
      });
    }

    for (const [dateString, formatString] of [
      ['2019-02-06T05:10:00-08:00', 'ISO8601'], 
      ['2019/02/06', 'yyyy/MM/dd']]
    ) {
      it(':android: can select dates on a UIDatePicker, format: ' + formatString, async () => {
        //rn-datepicker does not support testId's on android, so by.type is the only way to match the datepicker right now
        //@see https://github.com/react-native-datetimepicker/datetimepicker#view-props-optional-ios-only
        await element(by.type('android.widget.DatePicker')).setDatePickerDate(dateString, formatString);
        await element(by.text('OK')).tap();

        await waitFor(element(by.id('localDateLabel'))).toHaveText('Date (Local): Feb 6th, 2019').withTimeout(3000);
      });
    }
});
