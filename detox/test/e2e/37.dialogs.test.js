describe('alerts', () => {

  beforeAll(async () => {
    await device.launchApp({
      delete: true,
      newInstance: true,
    });
  });

  beforeEach(async () => {
    await device.reloadReactNative();
    await element(by.text('Alerts')).tap();
  });

  it('should click on ok and cancel buttons', async () => {
    await expect(element(by.id('AlertScreen.Text'))).toHaveText('Not Pressed');
    await element(by.id('AlertScreen.Button')).tap();
    await expect(element(by.text('Alert Title'))).toBeVisible();
    await expect(element(by.text('My Alert Msg'))).toBeVisible();
    await element(by.text('OK')).tap();
    await expect(element(by.id('AlertScreen.Text'))).toHaveText('OK Pressed');
    await element(by.id('AlertScreen.Button')).tap();
    await element(by.text('Cancel')).tap();
    await expect(element(by.id('AlertScreen.Text'))).toHaveText('Cancel Pressed');
  });
});
