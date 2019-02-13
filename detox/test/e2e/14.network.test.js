const MockServer = require('../mock-server/mock-server');
const LONG_REQUEST_TIME = 3000;
const assert = require('assert');

describe('Network Synchronization', () => {
  let mockServer = new MockServer();
  let start;

  before(() => {
    mockServer.init();
  });

  after(() => {
    mockServer.close();
  });

  function expectThatDetoxDidNotWait() {
    const timeWaited = (new Date().getTime()) - start;
    assert.ok(timeWaited < LONG_REQUEST_TIME);
  }

  function expectThatDetoxDidWait() {
    const timeWaited = (new Date().getTime()) - start;
    assert.ok(timeWaited >= LONG_REQUEST_TIME);
  }

  beforeEach(async () => {
    await device.reloadReactNative();
    await element(by.text('Network')).tap();
    start = new Date().getTime();
  });

  it('Sync with short network requests - 100ms', async () => {
    await element(by.id('ShortNetworkRequest')).tap();
    await expect(element(by.text('Short Network Request Working!!!'))).toBeVisible();
  });

  it('Sync with long network requests - 3000ms', async () => {
    await element(by.id('LongNetworkRequest')).tap();
    await expect(element(by.text('Long Network Request Working!!!'))).toBeVisible();
    expectThatDetoxDidWait();
  });

  it('disableSynchronization() should disable sync', async () => {
    await device.disableSynchronization();
    await element(by.id('LongNetworkRequest')).tap();
    expectThatDetoxDidNotWait();
    await device.enableSynchronization();
  });

  it('setURLBlacklist() should disable synchronization for given endpoint', async () => {
    const url = device.getPlatform() === 'ios' ? '.*localhost.*' : '.*10.0.2.2.*';
    await device.setURLBlacklist([url]);
    await element(by.id('LongNetworkRequest')).tap();
    expectThatDetoxDidNotWait();
  });
});
