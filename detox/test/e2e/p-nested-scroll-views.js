describe('Nested Scroll Views', () => {
  beforeEach(async () => {
    await device.reloadReactNative();
  });

  beforeEach(async () => {
    await element(by.text('Nested ScrollView')).tap();
  });

  it('Should handle swipe', async () => {
    await element(by.id('parentScrollView')).swipe('up', 'fast', 0.5);
    await expect(element(by.text('Bottom'))).toBeVisible();
    await expect(element(by.text('Top'))).toBeNotVisible();
    await element(by.id('parentScrollView')).swipe('down', 'fast', 0.5);
    await expect(element(by.text('Bottom'))).toBeNotVisible();
    await expect(element(by.text('Top'))).toBeVisible();

    await element(by.id('childScrollView')).swipe('left', 'fast', 0.5);
    await expect(element(by.text('Right'))).toBeVisible();
    await expect(element(by.text('Left'))).toBeNotVisible();
    await element(by.id('childScrollView')).swipe('right', 'fast', 0.5);
    await expect(element(by.text('Right'))).toBeNotVisible();
    await expect(element(by.text('Left'))).toBeVisible();
  });
  it('Should handle scrollTo', async () => {
    await element(by.id('parentScrollView')).scrollTo('bottom');
    await expect(element(by.text('Bottom'))).toBeVisible();
    await expect(element(by.text('Top'))).toBeNotVisible();
    await element(by.id('parentScrollView')).scrollTo('top');
    await expect(element(by.text('Bottom'))).toBeNotVisible();
    await expect(element(by.text('Top'))).toBeVisible();

    await element(by.id('childScrollView')).scrollTo('right');
    await expect(element(by.text('Right'))).toBeVisible();
    await expect(element(by.text('Left'))).toBeNotVisible();
    await element(by.id('childScrollView')).scrollTo('left');
    await expect(element(by.text('Right'))).toBeNotVisible();
    await expect(element(by.text('Left'))).toBeVisible();
  });
  it('Should handle scroll', async () => {
    try {
      await element(by.id('parentScrollView')).scroll(500, 'down');
    } catch(e) {}
    await expect(element(by.text('Bottom'))).toBeVisible();
    await expect(element(by.text('Top'))).toBeNotVisible();
    try {
      await element(by.id('parentScrollView')).scroll(500, 'up');
    } catch(e) {}
    await expect(element(by.text('Bottom'))).toBeNotVisible();
    await expect(element(by.text('Top'))).toBeVisible();

    try {
      await element(by.id('childScrollView')).scroll(500, 'right');
    } catch(e) {}
    await expect(element(by.text('Right'))).toBeVisible();
    await expect(element(by.text('Left'))).toBeNotVisible();
    try {
      await element(by.id('childScrollView')).scroll(500, 'left');
    } catch(e) {}
    await expect(element(by.text('Right'))).toBeNotVisible();
    await expect(element(by.text('Left'))).toBeVisible();
  });
});