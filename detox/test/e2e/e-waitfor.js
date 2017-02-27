describe('WaitFor', () => {
  beforeEach(async() => {
    await simulator.reloadReactNativeApp();
  });

  beforeEach(async () => {
    await element(by.label('WaitFor')).tap();
  });

  it('should wait until an element exists', async () => {
    await expect(element(by.id('UniqueId336'))).toNotExist();
    await waitFor(element(by.id('UniqueId336'))).toExist().withTimeout(2000);
    await expect(element(by.id('UniqueId336'))).toExist();
  });

  it('should wait until an element becomes visible', async() => {
    await expect(element(by.id('UniqueId521'))).toBeNotVisible();
    await waitFor(element(by.id('UniqueId521'))).toBeVisible().withTimeout(2000);
    await expect(element(by.id('UniqueId521'))).toBeVisible();
  });

  it('should wait until an element is removed', async() => {
    await expect(element(by.id('UniqueId085'))).toBeVisible();
    await waitFor(element(by.id('UniqueId085'))).toBeNotVisible().withTimeout(2000);
    await expect(element(by.id('UniqueId085'))).toBeNotVisible();
  });

  it('should find element by scrolling until it is visible', async() => {
    await expect(element(by.label('Text5'))).toBeNotVisible();
    await waitFor(element(by.label('Text5'))).toBeVisible().whileElement(by.id('ScrollView630')).scroll(50, 'down');
    await expect(element(by.label('Text5'))).toBeVisible();
  });

});
