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

  });
  
