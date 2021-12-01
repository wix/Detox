const { expectToThrow } = require('./utils/custom-expects');

// Skipped on Android because there is no Android permissions support yet
describe(':ios: location request', () => {
  it('should show nothing in the app (permission request)', async () => {
    await device.relaunchApp({ permissions: { location: 'unset' } });
    await getLocation();

    await expect(element(by.id('error'))).not.toBeVisible();
    await expectToThrow(() => waitFor(element(by.id(`latitude`))).toBeVisible().withTimeout(5500));
  });

  it('should err when location permission was set to `never`', async () => {
    await device.relaunchApp({ permissions: { location: 'never' } });
    await getLocation();

    await expect(element(by.id('error'))).toHaveText('User denied access to location services.');
  });

  it('should allow to get and set location when location permission is set to `always`', async () => {
    await device.relaunchApp({ permissions: { location: 'always' } });
    await expectLocationToBeAvailable();
  });

  it('should allow to get and set location when location permission is set to `inuse`', async () => {
    await device.relaunchApp({ permissions: { location: 'inuse' } });
    await expectLocationToBeAvailable();
  });
});

describe(':android: location permission granted from manifest', () => {
  beforeEach(async () => {
    await device.relaunchApp();
  });

  it('should allow to get and set location', async () => {
    await expectLocationToBeAvailable();
  });
});

// Helpers

async function getLocation() {
  await element(by.text('Location')).tap();
  await element(by.id('getLocationButton')).tap();
}

async function expectLocationToBeAvailable() {
  const lat = -80.125;
  const lon = 66.5;

  await device.setLocation(lat, lon);
  await getLocation();

  await waitFor(element(by.id(`latitude`))).toHaveText(`Latitude: ${lat}`).withTimeout(5500);
  await expect(element(by.id(`longitude`))).toHaveText(`Longitude: ${lon}`);
}
