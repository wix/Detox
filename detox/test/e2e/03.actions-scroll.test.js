const custom = require('./utils/custom-it');

describe('Actions - Scroll', () => {
  beforeEach(async () => {
    await device.reloadReactNative();
    await element(by.text('Actions')).tap();
  });

  custom.it.withFailureIf.android.rn58OrNewer('should scroll for a small amount in direction', async () => {
    await expect(element(by.text('Text1'))).toBeVisible();
    await expect(element(by.text('Text4'))).not.toBeVisible();
    await expect(element(by.id('ScrollView161'))).toBeVisible();
    await element(by.id('ScrollView161')).scroll(100, 'down');
    await expect(element(by.text('Text1'))).not.toBeVisible();
    await expect(element(by.text('Text4'))).toBeVisible();
    await element(by.id('ScrollView161')).scroll(100, 'up');
    await expect(element(by.text('Text1'))).toBeVisible();
    await expect(element(by.text('Text4'))).not.toBeVisible();
  });

  custom.it.withFailureIf.android.rn58OrNewer('should scroll for a large amount in direction', async () => {
    await expect(element(by.text('Text6'))).not.toBeVisible();
    await element(by.id('ScrollView161')).scroll(220, 'down');
    await expect(element(by.text('Text6'))).toBeVisible();
  });

  it('should scroll for a large amount in horizontal direction', async () => {
    await expect(element(by.text('HText7'))).not.toBeVisible();
    await element(by.id('ScrollViewH')).scroll(220, 'right');
    await expect(element(by.text('HText7'))).toBeVisible();
  });

  it('should scroll to edge', async () => {
    await expect(element(by.text('Text12'))).not.toBeVisible();
    await element(by.id('ScrollView161')).scrollTo('bottom');
    await expect(element(by.text('Text12'))).toBeVisible();
    await element(by.id('ScrollView161')).scrollTo('top');
    await expect(element(by.text('Text1'))).toBeVisible();
  });

  it('should scroll horizontally to edge', async () => {
    await expect(element(by.text('HText8'))).not.toBeVisible();
    await element(by.id('ScrollViewH')).scrollTo('right');
    await expect(element(by.text('HText8'))).toBeVisible();
    await element(by.id('ScrollViewH')).scrollTo('left');
    await expect(element(by.text('HText1'))).toBeVisible();
  });

  it('should scroll from a custom start-position ratio', async () => {
    await expect(element(by.text('Text12'))).not.toBeVisible();
    await element(by.id('toggleScrollOverlays')).tap();
    await element(by.id('ScrollView161')).scroll(550, 'down', 0.8, 0.6);
    await element(by.id('toggleScrollOverlays')).tap();
    await expect(element(by.text('Text12'))).toBeVisible();

    await element(by.id('toggleScrollOverlays')).tap();
    await element(by.id('ScrollView161')).scroll(550, 'up', 0.2, 0.4);
    await element(by.id('toggleScrollOverlays')).tap();
    await expect(element(by.text('Text12'))).not.toBeVisible();
  });

  it('should scroll horizontally from a custom start-position ratio', async () => {
    await expect(element(by.text('HText6'))).not.toBeVisible();
    await element(by.id('toggleScrollOverlays')).tap();
    await element(by.id('ScrollViewH')).scroll(220, 'right', 0.8, 0.6);
    await element(by.id('toggleScrollOverlays')).tap();
    await expect(element(by.text('HText6'))).toBeVisible();

    await element(by.id('toggleScrollOverlays')).tap();
    await element(by.id('ScrollViewH')).scroll(220, 'left', 0.2, 0.4);
    await element(by.id('toggleScrollOverlays')).tap();
    await expect(element(by.text('HText6'))).not.toBeVisible();
  });

  it(':android: should be able to scrollToIndex on horizontal scrollviews', async () => {
    // should ignore out of bounds children
    await element(by.id('ScrollViewH')).scrollToIndex(3000);
    await element(by.id('ScrollViewH')).scrollToIndex(-1);
    await expect(element(by.text('HText1'))).toBeVisible();

    await expect(element(by.text('HText8'))).not.toBeVisible();
    await element(by.id('ScrollViewH')).scrollToIndex(7);
    await expect(element(by.text('HText8'))).toBeVisible();
    await expect(element(by.text('HText1'))).not.toBeVisible();

    await element(by.id('ScrollViewH')).scrollToIndex(0);
    await expect(element(by.text('HText1'))).toBeVisible();
    await expect(element(by.text('HText8'))).not.toBeVisible();
  });

  it(':android: should be able to scrollToIndex on vertical scrollviews', async () => {
    // should ignore out of bounds children
    await element(by.id('ScrollView161')).scrollToIndex(3000);
    await element(by.id('ScrollView161')).scrollToIndex(-1);
    await expect(element(by.text('Text1'))).toBeVisible();

    await element(by.id('ScrollView161')).scrollToIndex(11);
    await expect(element(by.text('Text12'))).toBeVisible();

    await element(by.id('ScrollView161')).scrollToIndex(0);
    await expect(element(by.text('Text1'))).toBeVisible();

    await element(by.id('ScrollView161')).scrollToIndex(7);
    await expect(element(by.text('Text8'))).toBeVisible();
  });
});
