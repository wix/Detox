describe('Matchers', () => {
  beforeEach(async () => {
    await device.reloadReactNative();
    await element(by.text('Matchers')).tap();
  });

  it('should match elements by (accesibility) label', async () => {
    await element(by.label('Label')).tap();
    await expect(element(by.text('Label Working!!!'))).toBeVisible();
  });

  it('should match elements by (accesibility) id', async () => {
    await element(by.id('UniqueId345')).tap();
    await expect(element(by.text('ID Working!!!'))).toBeVisible();
  });

  it('should match elements by type (native class)', async () => {
    const byType = device.getPlatform() === 'ios' ? by.type('RCTImageView') : by.type('android.widget.ImageView');

    await expect(element(byType)).toBeVisible();
    await element(byType).tap();
    await expect(element(byType)).toBeNotVisible();
  });

  // https://facebook.github.io/react-native/docs/accessibility.html#accessibilitytraits-ios
  // Accessibility Inspector in the simulator can help investigate traits
  it(':ios: should match elements by accesibility trait', async () => {
    await element(by.traits(['button', 'text'])).tap();
    await expect(element(by.text('Traits Working!!!'))).toBeVisible();
  });

  it('should match elements with ancenstor (parent)', async () => {
    await expect(element(by.id('Grandson883').withAncestor(by.id('Son883')))).toExist();
    await expect(element(by.id('Son883').withAncestor(by.id('Grandson883')))).toNotExist();
    await expect(element(by.id('Grandson883').withAncestor(by.id('Father883')))).toExist();
    await expect(element(by.id('Father883').withAncestor(by.id('Grandson883')))).toNotExist();
    await expect(element(by.id('Grandson883').withAncestor(by.id('Grandfather883')))).toExist();
    await expect(element(by.id('Grandfather883').withAncestor(by.id('Grandson883')))).toNotExist();
  });

  it('should match elements with descendant (child)', async () => {
    await expect(element(by.id('Son883').withDescendant(by.id('Grandson883')))).toExist();
    await expect(element(by.id('Grandson883').withDescendant(by.id('Son883')))).toNotExist();
    await expect(element(by.id('Father883').withDescendant(by.id('Grandson883')))).toExist();
    await expect(element(by.id('Grandson883').withDescendant(by.id('Father883')))).toNotExist();
    await expect(element(by.id('Grandfather883').withDescendant(by.id('Grandson883')))).toExist();
    await expect(element(by.id('Grandson883').withDescendant(by.id('Grandfather883')))).toNotExist();
  });

  it('should match elements by using two matchers together with and', async () => {
    await expect(element(by.id('UniqueId345').and(by.text('ID')))).toExist();
    await expect(element(by.id('UniqueId345').and(by.text('RandomJunk')))).toNotExist();
  });

  // waiting to upgrade EarlGrey version in order to test this (not supported in our current one)
  it.skip('should choose from multiple elements matching the same matcher using index', async () => {
    await expect(element(by.text('Product')).atIndex(2)).toHaveId('ProductId002');
  });

});
