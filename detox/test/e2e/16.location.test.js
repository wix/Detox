describe('location', () => {
  const lat = -80.125;
  const lon = 66.5;

  // Skipped on Android because there is no Android permissions support yet
  it(':ios: Location should be unavailable', async () => {
    await device.relaunchApp({ permissions: { location: 'never' } });
    await element(by.text('Location')).tap();
    await element(by.id('getLocationButton')).tap();
    await expect(element(by.id('error'))).toBeVisible();
  });

  it('Should accept a location', async () => {
    await device.relaunchApp({ permissions: { location: 'always' } });
    await device.setLocation(lat, lon);
    await element(by.text('Location')).tap();
    await element(by.id('getLocationButton')).tap();
    await waitFor(element(by.text(`Latitude: ${lat}`))).toBeVisible().withTimeout(5500);

    await expect(element(by.text(`Latitude: ${lat}`))).toBeVisible();
    await expect(element(by.text(`Longitude: ${lon}`))).toBeVisible();
  });
});
