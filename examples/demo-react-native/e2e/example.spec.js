describe('Example', () => {
  beforeEach(async () => {
    await device.reloadReactNative();
  });
  
  it('should have welcome screen', async () => {
    await expect(element(by.id('welcome'))).toBeVisible();
  });

  it('open datePicker screen', async () => {
    await element(by.id('datePickerIOS')).tap();
    await expect(element(by.type('UIPickerView'))).toBeVisible();
    await element(by.type('UIPickerView')).setColumnToValue(1,"6")
    await element(by.type('UIPickerView')).setColumnToValue(2,"34")
    await element(by.id('back_button')).tap();
  });
  
  it('should show hello screen after tap', async () => {
    await element(by.id('hello_button')).tap();
    await expect(element(by.text('Hello!!!'))).toBeVisible();
  });
  
  it('should show world screen after tap', async () => {
    await element(by.id('world_button')).tap();
    await expect(element(by.text('World!!!'))).toBeVisible();
  });
});