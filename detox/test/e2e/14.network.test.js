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
    await driver.shortRequest.sendButton.tap();
    await driver.shortRequest.expectReplied();
  });
  
  it('should sync with long network requests - 3000ms', async () => {
    await driver.longRequest.sendButton.tap();
    await driver.longRequest.expectReplied();
  });

  it('disableSynchronization() should disable sync', async () => {
    await device.disableSynchronization();
    await waitFor(driver.longRequest.sendButton).toBeVisible().withTimeout(4000);

    await driver.longRequest.sendButton.tap();
    await driver.longRequest.expectRepliedAsync();

    await device.enableSynchronization();
  });

  describe('URL black-list (endpoints to ignore in network synchronization)', () => {

    afterEach(() => device.launchApp({ delete: true }));

    it('setURLBlacklist() should disable synchronization for given endpoint', async () => {
      await device.setURLBlacklist(['.*localhost.*']);

      await driver.longRequest.sendButton.tap();
      await driver.longRequest.expectRepliedAsync();
    });

    it('launchArgs with detoxURLBlacklistRegex should set the "black" (synchronization-ignore) list', async () => {
      const blackListRegexp = '^http://localhost:\\d{4}?\/[a-z]+\/\\d{4}?$';

      await device.launchApp({
        newInstance: true,
        launchArgs: { detoxURLBlacklistRegex: `\\("http://meaningless\.first\.url","${blackListRegexp}"\\)` },
      });
      await element(by.text('Network')).tap();

      await driver.longRequest.sendButton.tap();
      await driver.longRequest.expectRepliedAsync();
    });
  });
});

const driver = {
  shortRequest: {
    get sendButton() { return element(by.id('ShortNetworkRequest')) },
    get repliedText() { return element(by.text('Short Network Request Working!!!')) },
    expectReplied: () => expect(driver.shortRequest.repliedText).toBeVisible(),
  },

  longRequest: {
    get sendButton() { return element(by.id('LongNetworkRequest')) },
    get repliedText() { return element(by.text('Long Network Request Working!!!')) },
    expectReplied: () => expect(driver.longRequest.repliedText).toBeVisible(),
    expectRepliedAsync: async () => {
      await expect(driver.longRequest.repliedText).not.toBeVisible();
      await waitFor(driver.longRequest.repliedText).toBeVisible().withTimeout(4000);
    },
  },
};
