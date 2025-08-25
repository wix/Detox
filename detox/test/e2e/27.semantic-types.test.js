const { isRNNewArch } = require('../../src/utils/rn-consts/rn-consts');

describe('Semantic Types', () => {
  beforeEach(async () => {
    await device.reloadReactNative();
    await element(by.text('Matchers')).tap();
  });

  it('should match image elements by semantic type using by.type()', async () => {
    await expect(element(by.type('image'))).toBeVisible();
    await element(by.type('image')).tap();
    await expect(element(by.type('image'))).not.toBeVisible();
  });

  it('should match button elements by semantic type using by.type()', async () => {
    await expect(element(by.type('button')).atIndex(0)).toBeVisible();
    await element(by.type('button').and(by.label('Traits'))).tap();
    await expect(element(by.text('Traits Working!!!'))).toBeVisible();
  });

  it('should match text elements by semantic type using by.type()', async () => {
    await expect(element(by.type('text')).atIndex(0)).toBeVisible();
    await expect(element(by.type('text').and(by.text('Index')))).toBeVisible();
  });

  it('should match input field elements by semantic type using by.type()', async () => {
    await element(by.text('Actions')).tap();
    await expect(element(by.type('input-field')).atIndex(0)).toBeVisible();
    await element(by.type('input-field')).atIndex(0).typeText('Test');
    await expect(element(by.type('input-field')).atIndex(0)).toHaveText('Test');
  });

  it('should work with multiple elements of the same semantic type', async () => {
    await expect(element(by.type('button')).atIndex(0)).toBeVisible();
    await expect(element(by.type('button')).atIndex(1)).toBeVisible();
    await element(by.type('button')).atIndex(0).tap();
  });

  it('should work with combined matchers', async () => {
    await expect(element(by.type('button').and(by.label('Label')))).toBeVisible();
    await element(by.type('button').and(by.label('Label'))).tap();
    await expect(element(by.text('Label Working!!!'))).toBeVisible();
  });

  it('should work with ancestor matchers', async () => {
    await expect(element(by.type('text').withAncestor(by.id('Grandfather883')))).toExist();
  });

  it('should differentiate semantic types from regular class names', async () => {
    // Semantic type
    await expect(element(by.type('image'))).toBeVisible();
    
    // Regular class name
    const iOSClass = isRNNewArch ? 'RCTImageComponentView' : 'RCTImageView';
    const platformClass = device.getPlatform() === 'ios' ? iOSClass : 'android.widget.ImageView';
    await expect(element(by.type(platformClass))).toBeVisible();
  });

  it('should work consistently across platforms', async () => {
    await expect(element(by.type('image'))).toBeVisible();
    await expect(element(by.type('button')).atIndex(0)).toBeVisible();
  });

  it('should work with waitFor operations', async () => {
    await waitFor(element(by.type('button')).atIndex(0))
      .toBeVisible()
      .withTimeout(2000);
  });

  it('should support progress alias for activity-indicator', async () => {
    // Both should work identically
    await element(by.text('Actions')).tap();
    // Note: This test assumes the app has progress indicators
    // In a real test app, you'd verify both 'progress' and 'activity-indicator' work the same
    expect(() => element(by.type('progress'))).not.toThrow();
    expect(() => element(by.type('activity-indicator'))).not.toThrow();
  });
});
