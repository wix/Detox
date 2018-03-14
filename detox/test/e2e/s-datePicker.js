describe('DatePicker', () => {
    beforeEach(async () => {
      await device.reloadReactNative();
    });
  
    beforeEach(async () => {
      await element(by.text('DatePicker')).tap();
    });
    
    it('datePicker and dateLabel should be visible', async () => {
      await expect(element(by.type('UIPickerView'))).toBeVisible();
      await expect(element(by.id('timeLabel'))).toBeVisible();  
    });

    it('datePicker should be scroll and change time', async () => {
      await element(by.type('UIPickerView')).setColumnToValue(1,"6");
      await element(by.type('UIPickerView')).setColumnToValue(2,"34");
      await expect(element(by.id("timeLabel"))).toHaveText('choosenTime is 6:34');
    });

  });
  