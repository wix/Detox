const MockServer = require('../mock-server/mock-server');

describe('Network Synchronization', () => {
  const mockServer = new MockServer();

  beforeAll(async () => {
    mockServer.init();
    await device.reverseTcpPort(mockServer.port);
  });

  afterAll(async () => {
    await mockServer.close();
  });

  beforeEach(async () => {
    await device.reloadReactNative();
    await element(by.text('Network')).tap();
  });

  it('Sync with short network requests - 100ms', async () => {
    await element(by.id('ShortNetworkRequest')).tap();
    await expect(element(by.text('Short Network Request Working!!!'))).toBeVisible();
  });

  it('Sync with long network requests - 3000ms', async () => {
    await element(by.id('LongNetworkRequest')).tap();
    await expect(element(by.text('Long Network Request Working!!!'))).toBeVisible();
  });

  it('disableSynchronization() should disable sync', async () => {
    await device.disableSynchronization();
    await waitFor(element(by.id('LongNetworkRequest'))).toBeVisible().withTimeout(4000);
    await element(by.id('LongNetworkRequest')).tap();
    await expect(element(by.text('Long Network Request Working!!!'))).not.toBeVisible();
    await waitFor(element(by.text('Long Network Request Working!!!'))).toBeVisible().withTimeout(4000);
    await expect(element(by.text('Long Network Request Working!!!'))).toBeVisible();
    await device.enableSynchronization();
  });


  it('setURLBlacklist() should disable synchronization for given endpoint', async () => {
    await device.setURLBlacklist(['.*localhost.*']);

    await element(by.id('LongNetworkRequest')).tap();
    await expect(element(by.text('Long Network Request Working!!!'))).not.toBeVisible();
    await waitFor(element(by.text('Long Network Request Working!!!'))).toBeVisible().withTimeout(4000);
    await expect(element(by.text('Long Network Request Working!!!'))).toBeVisible();

    await device.setURLBlacklist([]);
  });

  it(':android: launchArgs with detoxURLBlacklistRegex should set the blacklist', async () => {
    await device.launchApp({
      newInstance: true,
      launchArgs: { detoxURLBlacklistRegex: ' \\("^http:\/\/localhost:\\d{4}?\/[a-z]+\/\\d{4}?$"\\)' },
    });

    await device.reloadReactNative();

    await element(by.text('Network')).tap();
    await element(by.id('LongNetworkRequest')).tap();
    await expect(element(by.text('Long Network Request Working!!!'))).not.toBeVisible();
    await waitFor(element(by.text('Long Network Request Working!!!'))).toBeVisible().withTimeout(4000);
    await expect(element(by.text('Long Network Request Working!!!'))).toBeVisible();

    await device.setURLBlacklist([]);
  });
});
