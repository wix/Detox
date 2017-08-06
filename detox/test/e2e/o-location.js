describe('location', () => {
  it('Location should be unavabilable', async () => {
    await device.relaunchApp({permissions: {location: 'never'}});
    await element(by.label('Location')).tap();
    await element(by.id('getLocationButton')).tap();
    await expect(element(by.id('error'))).toBeVisible();
  });

  it('Should receive location (20,20)', async () => {
    await device.relaunchApp({permissions: {location: 'always'}});
    await device.setLocation(20, 20);
    await element(by.label('Location')).tap();
    await element(by.id('getLocationButton')).tap();
    await expect(element(by.text('Latitude: 20'))).toBeVisible();
    await expect(element(by.text('Longitude: 20'))).toBeVisible();
  });
});
