describe('DatePicker', () => {
    beforeEach(async () => {
      await device.reloadReactNative();
    });
  
    beforeEach(async () => {
      await element(by.text('DatePicker')).tap();
    });
    
    it('check and scroll datePicker', async () => {
        await expect(element(by.type('UIPickerView'))).toBeVisible();
        await element(by.type('UIPickerView')).setColumnToValue(1,"6");
        await element(by.type('UIPickerView')).setColumnToValue(2,"34");
    });

  });
  