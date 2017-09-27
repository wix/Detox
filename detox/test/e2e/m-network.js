const MockServer = require('../mock-server/mock-server');

describe('Network Synchronization', () => {
  let mockServer = new MockServer();

  before(async () => {
    mockServer.init();
  });

  after( () => {
    mockServer.close();
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
    await expect(element(by.text('Long Network Request Working!!!'))).toBeNotVisible();
    await waitFor(element(by.text('Long Network Request Working!!!'))).toBeVisible().withTimeout(4000);
    await expect(element(by.text('Long Network Request Working!!!'))).toBeVisible();

    await device.enableSynchronization();
  });


  it(':ios: setURLBlacklist() should disable synchronization for given endpoint', async () => {
    const url = device.getPlatform() === 'ios' ? '.*localhost.*' : '*10.0.2.2*';
    await device.setURLBlacklist([url]);

    await element(by.id('LongNetworkRequest')).tap();
    await expect(element(by.text('Long Network Request Working!!!'))).toBeNotVisible();
    await waitFor(element(by.text('Long Network Request Working!!!'))).toBeVisible().withTimeout(4000);
    await expect(element(by.text('Long Network Request Working!!!'))).toBeVisible();

    await device.setURLBlacklist([]);
  });
});
