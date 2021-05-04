const jestExpect = require('expect');

describe(':android: Attributes', () => {
  beforeEach(async () => {
    await device.reloadReactNative();
    await element(by.text('Attributes')).tap();
  });

  it('should get attributes for view', async () => {
    const attrJson = await element(by.id('viewId')).getAttributes();

    jestExpect(attrJson.alpha).toBe(1);
    jestExpect(attrJson.visibility).toBe("visible");
    jestExpect(attrJson.elevation).toBe(0);
    jestExpect(attrJson.height).toBe(263);
    jestExpect(attrJson.width).toBe(263);
    jestExpect(attrJson.hasFocus).toBeTruthy();
    jestExpect(attrJson.isEnabled).toBeTruthy();
  });

  it('should get attributes for textview', async () => {
    const attrJson = await element(by.id('textViewId')).getAttributes();
    const expectedText = 'TextView';

    jestExpect(attrJson.alpha).toBe(1);
    jestExpect(attrJson.visibility).toBe("visible");
    jestExpect(attrJson.elevation).toBe(0);
    jestExpect(attrJson.height).toBe(51);
    jestExpect(attrJson.width).toBe(1080);
    jestExpect(attrJson.hasFocus).toBeTruthy();
    jestExpect(attrJson.isEnabled).toBeTruthy();

    jestExpect(attrJson.text).toBe(expectedText);
    jestExpect(attrJson.length).toBe(expectedText.length);
    jestExpect(attrJson.textSize).toBe(37.0);
    jestExpect(attrJson.lineHeight).toBe(43);
  });
});
