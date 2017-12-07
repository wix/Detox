const detox = require('detox');

// console.log(detox);
// console.log(detox.element);
// console.log(detox.by);
// console.log(detox.expect);
// console.log(detox.device);


describe('Example', () => {
  beforeEach(async () => {
    // await device.reloadReactNative();
    await detox.device.reloadReactNative();
  });
  
  it('should have welcome screen', async () => {
    // await expect(element(by.id('welcome'))).toBeVisible();
    await detox.expect(detox.element(detox.by.id('welcome'))).toBeVisible();
  });
  
  it('should show hello screen after tap', async () => {
    // await element(by.id('hello_button')).tap();
    await detox.element(detox.by.id('hello_button')).tap();
    // await expect(element(by.text('Hello!!!'))).toBeVisible();
    await detox.expect(detox.element(detox.by.text('Hello!!!'))).toBeVisible();
  });
  
  it('should show world screen after tap', async () => {
    // await element(by.id('world_button')).tap();
    await detox.element(detox.by.id('world_button')).tap();
    // await expect(element(by.text('World!!!'))).toBeVisible();
    await detox.expect(detox.element(detox.by.text('World!!!'))).toBeVisible();
  });
});