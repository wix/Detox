const jestExpect = require('expect').default;

describe('Semantic Types', () => {
  beforeEach(async () => {
    await device.reloadReactNative();
    await element(by.text('Matchers')).tap();
  });

  it('should match image elements by semantic type using by.type()', async () => {
    await expect(element(by.type('image')).atIndex(0)).toBeVisible();
  });

  it('should match text elements by semantic type using by.type()', async () => {
    await expect(element(by.type('text')).atIndex(0)).toBeVisible();
    await expect(element(by.type('text').and(by.text('Label')))).toBeVisible();
  });

  it('should match input field elements by semantic type using by.type()', async () => {
    await device.reloadReactNative();
    await element(by.text('Actions')).tap();
    await expect(element(by.type('input-field')).atIndex(0)).toBeVisible();
    await element(by.type('input-field')).atIndex(0).typeText('Test');
    await expect(element(by.type('input-field')).atIndex(0)).toHaveText('Test');
  });

  it('should support progress alias for activity-indicator', async () => {
    await expect(element(by.type('progress'))).toExist();
    await expect(element(by.type('activity-indicator'))).toExist();

    const progressAttrs = await element(by.type('progress')).getAttributes();
    const activityIndicatorAttrs = await element(by.type('activity-indicator')).getAttributes();
    jestExpect(progressAttrs.identifier).toEqual(activityIndicatorAttrs.identifier);
  });

  it('should match scrollview elements by semantic type', async () => {
    await expect(element(by.type('scrollview')).atIndex(0)).toExist();
  });

  it('should match list elements by semantic type', async () => {
    await expect(element(by.type('list')).atIndex(0)).toExist();
  });

  it('should match switch elements by semantic type', async () => {
    await expect(element(by.type('switch'))).toExist();
  });

  it('should match slider elements by semantic type', async () => {
    await expect(element(by.type('slider'))).toExist();
  });

  it('should match picker elements by semantic type', async () => {
    await expect(element(by.type('picker'))).toExist();
  });
});
