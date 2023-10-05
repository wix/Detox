import { by, device, element, expect } from 'detox';

describe('Test suite 1', () => {
  beforeAll(async () => {
    await device.relaunchApp();
  });

  it('should have welcome screen', async () => {
    await expect(element(by.id('welcome'))).toBeVisible();
  });

  it('should show hello screen after tap', async () => {
    await element(by.id('hello_button')).tap();
    await expect(element(by.text('Hello!!!'))).toBeVisible();
  });
});
