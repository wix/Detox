const detox = require('detox');
const {expect, element} = detox;

describe('Example', () => {
  beforeEach(async () => {
    await detox.device.reloadReactNative();
  });
  
  it('should have welcome screen', async () => {
    await expect(element(detox.by.id('welcome'))).toBeVisible();
  });
  
  it('should show hello screen after tap', async () => {
    await element(detox.by.id('hello_button')).tap();
    await expect(element(detox.by.text('Hello!!!'))).toBeVisible();
  });
  
  it('should show world screen after tap', async () => {
    await element(detox.by.id('world_button')).tap();
    await expect(element(detox.by.text('World!!!'))).toBeVisible();
  });
});