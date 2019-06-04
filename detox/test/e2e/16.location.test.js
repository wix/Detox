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

describe(':ios: location', () => {
  it('Location should be unavailable', async () => {
    if (!await isFbsimctlInstalled()) {
      return;
    }
    await device.relaunchApp({ permissions: { location: 'never' } });
    await element(by.text('Location')).tap();
    await element(by.id('getLocationButton')).tap();
    await expect(element(by.id('error'))).toBeVisible();
  });

  it('Should receive location (20,20)', async () => {
    if (!await isFbsimctlInstalled()) {
      return;
    }
    await device.relaunchApp({ permissions: { location: 'always' } });
    await device.setLocation(20.1, 20.2);
    await element(by.text('Location')).tap();
    await element(by.id('getLocationButton')).tap();
    await waitFor(element(by.text('Latitude: 20.1'))).toBeVisible().withTimeout(3000);

    await expect(element(by.text('Latitude: 20.1'))).toBeVisible();
    await expect(element(by.text('Longitude: 20.2'))).toBeVisible();
  });
});
