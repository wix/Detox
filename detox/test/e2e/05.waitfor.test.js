const custom = require('./utils/custom-it');

describe('WaitFor', () => {
  beforeEach(async() => {
    await device.reloadReactNative();
    await element(by.text('WaitFor')).tap();
  });

  it('should wait until an element is created and exists in layout', async () => {
    await expect(element(by.id('createdAndVisibleText'))).toNotExist();
    await element(by.id('GoButton')).tap();
    await waitFor(element(by.id('createdAndVisibleText'))).toExist().withTimeout(20000);
    await expect(element(by.id('createdAndVisibleText'))).toExist();
  });

  it('should wait until an element is removed', async () => {
    await expect(element(by.id('deletedFromHierarchyText'))).toBeVisible();
    await element(by.id('GoButton')).tap();
    await waitFor(element(by.id('deletedFromHierarchyText'))).toBeNotVisible().withTimeout(20000);
    await expect(element(by.id('deletedFromHierarchyText'))).toBeNotVisible();
  });

  custom.it.withFailureIf.android.rn58OrNewer('should find element by scrolling until it is visible', async () => {
    await expect(element(by.text('Text5'))).toBeNotVisible();
    await element(by.id('GoButton')).tap();
    await waitFor(element(by.text('Text5'))).toBeVisible().whileElement(by.id('ScrollView')).scroll(50, 'down');
    await expect(element(by.text('Text5'))).toBeVisible();
  });
});
