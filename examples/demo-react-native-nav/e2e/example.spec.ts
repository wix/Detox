describe('Example', () => {
  before(async () => {
    await device.launchApp();
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('should have route', async () => {
    await expect(element(by.id('route_name'))).toBeVisible();
  });

  it('should show app2 after tap and app after pop', async () => {
    await element(by.id('app_button_2')).tap();
    await expect(element(by.text('App2'))).toBeVisible();
    await element(by.id('app_button_pop')).tap();
    await expect(element(by.text('App'))).toBeVisible();
  });

  it('should display and dismiss an alert', async () => {
    await element(by.id('app_button_alert')).tap();
    await expect(element(by.text('Some alert'))).toBeVisible();
    await element(by.label('Close').and(by.type('_UIAlertControllerActionView'))).tap();
    await expect(element(by.text('Some alert'))).toBeNotVisible();
  });

  it('should handle multiple screens', async () => {
    await element(by.id('app_button_2')).tap();
    await expect(element(by.text('App2'))).toBeVisible();
    await element(by.id('app_button_3')).tap();
    await expect(element(by.text('App3'))).toBeVisible();
    await element(by.id('app_button_4')).tap();
    await expect(element(by.text('App4'))).toBeVisible();
    await element(by.id('app_button_5')).tap();
    await expect(element(by.text('App5'))).toBeVisible();
  });
});
