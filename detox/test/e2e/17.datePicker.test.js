describe(':ios: DatePicker', () => {
    beforeEach(async () => {
      await device.reloadReactNative();
      await element(by.text('DatePicker')).tap();
    });

    it('datePicker should trigger change handler correctly', async () => {
      await element(by.type('UIPickerView')).setColumnToValue(1,"6");
      await element(by.type('UIPickerView')).setColumnToValue(2,"34");
      await expect(element(by.id("timeLabel"))).toHaveText('choosenTime is 6:34');
    });

    it('can select dates on a UIDatePicker', async () => {
      await element(by.type('UIDatePicker')).setDatePickerDate('2019-02-06T05:10:00-08:00', "yyyy-MM-dd'T'HH:mm:ssZZZZZ");

      await expect(element(by.id('dateTimeLabel'))).toHaveText('choosenDateTime is 2-6-2019 5:10');
    });

});
