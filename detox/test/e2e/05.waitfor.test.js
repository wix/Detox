const custom = require('./utils/custom-it');
const {expectToThrow} = require('./utils/custom-expects');

describe('WaitFor', () => {
  beforeEach(async() => {
    await device.reloadReactNative();
    await element(by.text('WaitFor')).tap();
  });

  it('should wait until an element is created and exists in layout', async () => {
    await expect(await element(by.id('createdAndVisibleText'))).toNotExist();
    await element(by.id('GoButton')).tap();
    await waitFor(element(by.id('createdAndVisibleText'))).toExist().withTimeout(20000);
  });

  it('should wait until an element is removed', async () => {
    const timeout = 20000;

    await expect(await element(by.id('deletedFromHierarchyText'))).toBeVisible();
    await element(by.id('GoButton')).tap();

    const startTime = new Date().getTime();
    await waitFor(element(by.id('deletedFromHierarchyText'))).toBeNotVisible().withTimeout(timeout);
    const endTime = new Date().getTime();

    if (endTime - startTime > timeout) {
      throw new Error(`Action not expired even after a timeout`);
    }

    await expect(await element(by.id('deletedFromHierarchyText'))).toBeNotVisible();
  });

  custom.it.withFailureIf.android.rn58OrNewer('should find element by scrolling until it is visible', async () => {
    await expect(await element(by.text('Text5'))).toBeNotVisible();
    await element(by.id('GoButton')).tap();
    await waitFor(element(by.text('Text5'))).toBeVisible().whileElement(by.id('ScrollView')).scroll(50, 'down');
    await expect(await element(by.text('Text5'))).toBeVisible();
  });

  it('should fail test after waiting for element to exist but it doesn\'t at the end', async () => {
    await expect(await element(by.id('neverAppearingText'))).toNotExist();
    await expectToThrow(() => waitFor(element(by.id('neverAppearingText'))).toExist().withTimeout(1000));
  });

  it('should abort scrolling if element was not found', async () => {
    await element(by.id('GoButton')).tap();
    await expectToThrow(() => waitFor(element(by.text('Text1000'))).toBeVisible().whileElement(by.id('ScrollView')).scroll(50, 'down'));
    await expect(await element(by.text('Text1000'))).toBeNotVisible();
  });
});
