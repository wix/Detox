describe('Matchers', () => {
  beforeEach(async () => {
    await device.reloadReactNative();
    await element(by.text('Matchers')).tap();
  });

  it('should match elements by (accessibility) label', async () => {
    await element(by.label('Label')).tap();
    await expect(element(by.text('Label Working!!!'))).toBeVisible();
  });

  it('should match elements by (accessibility) id', async () => {
    await element(by.id('UniqueId345')).tap();
    await expect(element(by.text('ID Working!!!'))).toBeVisible();
  });

  it('should match elements by index', async () => {
    await element(by.text('Index')).atIndex(0).tap();
    await expect(element(by.text('First button pressed!!!'))).toBeVisible();
  });

  it('should not crash after an attempt to tap an element with an out-of-bounds index', async () => {
    try {
      await element(by.text('Index')).atIndex(100500).tap();
    } catch (e) {
      console.log('Caught an expected error, now moving forward...');
    }

    await element(by.text('Index')).atIndex(0).tap();
    await expect(element(by.text('First button pressed!!!'))).toBeVisible();
  });

  it('should be able to swipe elements matched by index', async () => {
    await element(by.text('Index')).atIndex(0).swipe('down', 'fast', 0.7); //No need to do here anything, just let it not crash.
  });

  it('should match elements by type (native class)', async () => {
    const byType = device.getPlatform() === 'ios' ? by.type('RCTImageView') : by.type('android.widget.ImageView');

    await expect(element(byType)).toBeVisible();
    await element(byType).tap();
    await expect(element(byType)).not.toBeVisible();
  });

  // https://developer.apple.com/documentation/uikit/accessibility/uiaccessibility/accessibility_traits
  // Accessibility Inspector in the simulator can help investigate traits
  it(':ios: should match elements by accessibility traits', async () => {
    await element(by.traits(['button'])).tap();
    await expect(element(by.text('Traits Working!!!'))).toBeVisible();
  });

  it('should match elements with ancenstor (parent)', async () => {
    await expect(element(by.id('Grandson883').withAncestor(by.id('Son883')))).toExist();
    await expect(element(by.id('Son883').withAncestor(by.id('Grandson883')))).not.toExist();
    await expect(element(by.id('Grandson883').withAncestor(by.id('Father883')))).toExist();
    await expect(element(by.id('Father883').withAncestor(by.id('Grandson883')))).not.toExist();
    await expect(element(by.id('Grandson883').withAncestor(by.id('Grandfather883')))).toExist();
    await expect(element(by.id('Grandfather883').withAncestor(by.id('Grandson883')))).not.toExist();
  });

  it('should match elements with descendant (child)', async () => {
    await expect(element(by.id('Son883').withDescendant(by.id('Grandson883')))).toExist();
    await expect(element(by.id('Grandson883').withDescendant(by.id('Son883')))).not.toExist();
    await expect(element(by.id('Father883').withDescendant(by.id('Grandson883')))).toExist();
    await expect(element(by.id('Grandson883').withDescendant(by.id('Father883')))).not.toExist();
    await expect(element(by.id('Grandfather883').withDescendant(by.id('Grandson883')))).toExist();
    await expect(element(by.id('Grandson883').withDescendant(by.id('Grandfather883')))).not.toExist();
  });

  it('should match elements by using two matchers together with and', async () => {
    await expect(element(by.id('UniqueId345').and(by.text('ID')))).toExist();
    await expect(element(by.id('UniqueId345').and(by.text('RandomJunk')))).not.toExist();
    await expect(element(by.id('UniqueId345').and(by.label('RandomJunk')))).not.toExist();
    if (device.getPlatform() === 'ios') {
      await expect(element(by.id('UniqueId345').and(by.traits(['button'])))).not.toExist();
    }
  });

  it(':ios: should choose from multiple elements matching the same matcher using index', async () => {
    await expect(element(by.text('Product')).atIndex(2)).toHaveId('ProductId002');
  });
});
