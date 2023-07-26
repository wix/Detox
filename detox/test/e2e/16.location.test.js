const exec = require('child-process-promise').exec;

//TODO: Ignoring the test in CI until fbsimctl supports Xcode 9
async function isFbsimctlInstalled() {
  try {
    await exec(`which fbsimctl`);
    return true;
  } catch (e) {
    console.log(`setLocation only works through fbsimctl currently`);
    return false;
  }
}

describe('location', () => {
  const lat = -80.125;
  const lon = 66.5;

  // Skipped on Android because there is no Android permissions support yet
  it(':ios: Location should be unavailable', async () => {
    if (!await isFbsimctlInstalled()) {
      return;
    }
    await device.relaunchApp({ permissions: { location: 'never' } });
    await element(by.text('Location')).tap();
    await element(by.id('getLocationButton')).tap();
    await expect(element(by.id('error'))).toBeVisible();
  });

  it('Should accept a location', async () => {
    const isIOS = device.getPlatform() === 'ios';

    if (isIOS && !await isFbsimctlInstalled()) {
      return;
    }

    await device.relaunchApp({ permissions: { location: 'always' } });
    await device.setLocation(lat, lon);
    await element(by.text('Location')).tap();
    await element(by.id('getLocationButton')).tap();
    await waitFor(element(by.text(`Latitude: ${lat}`))).toBeVisible().withTimeout(5500);

    await expect(element(by.text(`Latitude: ${lat}`))).toBeVisible();
    await expect(element(by.text(`Longitude: ${lon}`))).toBeVisible();
  });
});
