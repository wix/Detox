describe(':ios: DatePicker', () => {
    beforeEach(async () => {
      await device.reloadReactNative();
      await element(by.text('DatePicker')).tap();
    });

    it('setColumnToValue should not work for a date picker', async () => {
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

    it('can select dates on a UIDatePicker', async () => {
      await element(by.id('datePicker')).setDatePickerDate('2019-02-06T05:10:00-08:00', "ISO8601");
      await expect(element(by.id('utcDateLabel'))).toHaveText('Date (UTC): Feb 6th, 2019');
      await expect(element(by.id('utcTimeLabel'))).toHaveText('Time (UTC): 1:10 PM');
    });
});
