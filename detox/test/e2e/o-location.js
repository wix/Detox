const exec = require('child-process-promise').exec;

async function isFbsimctlInstalled() {
  try {
    await exec(`which fbsimctl`);
    return true;
  } catch (e) {
    return false;
  }
}

describe('location', () => {
  it('Location should be unavabilable', async () => {
    const fbsimclInstalled = await isFbsimctlInstalled();
    if (!fbsimclInstalled) {
      console.log(`setLocation only works through fbsimcl currently`);
      return;
    }
    await device.relaunchApp({ permissions: { location: 'never' } });
    await element(by.text('Location')).tap();
    await element(by.id('getLocationButton')).tap();
    await expect(element(by.id('error'))).toBeVisible();
  });

  it('Should receive location (20,20)', async () => {
    const fbsimclInstalled = await isFbsimctlInstalled();
    if (!fbsimclInstalled) {
      console.log(`setLocation only works through fbsimcl currently`);
      return;
    }
    await device.relaunchApp({ permissions: { location: 'always' } });
    await device.setLocation(20, 20);
    await element(by.text('Location')).tap();
    await element(by.id('getLocationButton')).tap();
    await waitFor(element(by.text('Latitude: 20'))).toBeVisible().withTimeout(3000);

    await expect(element(by.text('Latitude: 20'))).toBeVisible();
    await expect(element(by.text('Longitude: 20'))).toBeVisible();
  });
});

