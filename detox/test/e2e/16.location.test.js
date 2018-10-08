const _ = require('lodash');
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
  let lat, long;

  beforeEach(() => {
    lat = _.random(-100, 100) + 0.125;
    long = _.random(-100, 100) + 0.25;
  });

  it(':ios: Location should be unavailable', async () => {
    if (!await isFbsimctlInstalled()) {
      return;
    }

    await device.relaunchApp({ permissions: { location: 'never' } });
    await element(by.text('Location')).tap();
    await element(by.id('getLocationButton')).tap();
    await expect(element(by.id('error'))).toBeVisible();
  });

  it('Should receive location (20,20)', async () => {
    if (device.platform() === 'ios' && !await isFbsimctlInstalled()) {
      return;
    }
    await device.relaunchApp({ permissions: { location: 'always' } });
    await device.setLocation(lat, long);

    await element(by.text('Location')).tap();
    await element(by.id('getLocationButton')).tap();
    await waitFor(element(by.text(`Latitude: ${lat}`))).toBeVisible().withTimeout(3000);

    await expect(element(by.text(`Latitude: ${lat}`))).toBeVisible();
    await expect(element(by.text(`Longitude: ${long}`))).toBeVisible();
  });
});
