describe('WaitFor', () => {
  beforeEach(async() => {
    await device.reloadReactNative();
    await element(by.text('WaitFor')).tap();
  });

  it('should wait until an element is created and exists in layout', async () => {
    await expect(element(by.id('createdAndVisibleText'))).toNotExist();
    await waitFor(element(by.id('createdAndVisibleText'))).toExist().withTimeout(2000);
    await expect(element(by.id('createdAndVisibleText'))).toExist();
  });

  it('should wait until an invisible element becomes visible', async() => {
    await expect(element(by.id('invisibleBecomingVisibleText'))).toBeNotVisible();
    await waitFor(element(by.id('invisibleBecomingVisibleText'))).toBeVisible().withTimeout(2000);
    await expect(element(by.id('invisibleBecomingVisibleText'))).toBeVisible();
  });

  it('should wait until an element is removed', async() => {
    await expect(element(by.id('deletedFromHierarchyText'))).toBeVisible();
    await waitFor(element(by.id('deletedFromHierarchyText'))).toBeNotVisible().withTimeout(2000);
    await expect(element(by.id('deletedFromHierarchyText'))).toBeNotVisible();
  });

  it('should find element by scrolling until it is visible', async() => {
    await expect(element(by.text('Text5'))).toBeNotVisible();
    await waitFor(element(by.text('Text5'))).toBeVisible().whileElement(by.id('ScrollView630')).scroll(50, 'down');
    await expect(element(by.text('Text5'))).toBeVisible();
  });

});
