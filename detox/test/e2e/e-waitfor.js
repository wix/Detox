
describe('WaitFor', () => {
  beforeEach(async() => {
    await device.reloadReactNative();
    await element(by.label('WaitFor')).tap();
  });

  it('should wait until an element is created and exists in layout', async () => {
    await expect(element(by.id('createdAndVisibleText'))).toNotExist();
    await waitFor(element(by.id('createdAndVisibleText'))).toExist().withTimeout(2000);
  });

  it('should fail the test when waiting for an element that does not exist', async () => {
    const failTest = () => expect(element(by.id('does-not-exist'))).toExist();
    try {
      await waitFor(element(by.id('does-not-exist'))).toExist().withTimeout(20);
      failTest()
    } catch (e) {
    }
  });

  it('should wait until an invisible element becomes visible', async() => {
    await expect(element(by.id('invisibleBecomingVisibleText'))).toBeNotVisible();
    await waitFor(element(by.id('invisibleBecomingVisibleText'))).toBeVisible().withTimeout(2000);
  });

  it('should wait until an element is removed', async() => {
    await expect(element(by.id('deletedFromHierarchyText'))).toBeVisible();
    await waitFor(element(by.id('deletedFromHierarchyText'))).toBeNotVisible().withTimeout(2000);
  });

  it('should find element by scrolling until it is visible', async() => {
    await expect(element(by.label('Text5'))).toBeNotVisible();
    await waitFor(element(by.label('Text5'))).toBeVisible().whileElement(by.id('ScrollView630')).scroll(50, 'down');
  });

});
