describe(':ios: DatePicker', () => {
    beforeEach(async () => {
      await device.reloadReactNative();
      await element(by.text('DatePicker')).tap();
    });

    it('datePicker should trigger change handler correctly', async () => {
      await element(by.id('datePicker')).setColumnToValue(1, "6");
      await element(by.id('datePicker')).setColumnToValue(2, "34");
      await expect(element(by.id('localTimeLabel'))).toHaveText('Time: 06:34');
    });

    it('can select dates on a UIDatePicker', async () => {
      await element(by.id('datePicker')).setDatePickerDate('2019-02-06T05:10:00-08:00', "yyyy-MM-dd'T'HH:mm:ssZZZZZ");
      await expect(element(by.id('utcDateLabel'))).toHaveText('Date (UTC): Feb 6th, 2019');
      await expect(element(by.id('utcTimeLabel'))).toHaveText('Time (UTC): 1:10 PM');
    });
});
