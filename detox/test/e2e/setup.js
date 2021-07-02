const { device } = require('detox');

beforeAll(async () => {
  if (device._currentApp) { // HACK: currently there's no API to tell whether we are in multi-apps mode or not
    await device.launchApp();
  }
});
