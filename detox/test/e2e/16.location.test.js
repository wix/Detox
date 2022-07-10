const { expectToThrow } = require('./utils/custom-expects');
const driver = require('./drivers/location-driver').locationScreenDriver;

// Skipped on Android because there is no Android permissions support yet
describe(':ios: location request', () => {
  it('should show nothing in the app (permission request dialog)', async () => {
    await device.launchApp({ permissions: { location: 'unset' } });

    await driver.openScreen();

    await expect(driver.errorElement).not.toBeVisible();
    await expectToThrow(() => driver.latitude.waitUntilVisible());
  });

  it('should err when location permission was set to `never`', async () => {
    await device.launchApp({ permissions: { location: 'never' } });

    await driver.openScreen();
    await driver.tapOnGetLocation();

    await expect(driver.errorElement).toHaveText('User denied access to location services.');
  });

  it('should allow to get and set location when location permission is set to `always`', async () => {
    await device.launchApp({ permissions: { location: 'always' } });
    await driver.expectLocationToBeAvailable();
  });

  it('should allow to get and set location when location permission is set to `inuse`', async () => {
    await device.launchApp({ permissions: { location: 'inuse' } });
    await driver.expectLocationToBeAvailable();
  });
});

describe(':android: location permission granted from manifest', () => {
  it('should allow to get and set location', async () => {
    await device.launchApp();
    await driver.expectLocationToBeAvailable();
  });
});
