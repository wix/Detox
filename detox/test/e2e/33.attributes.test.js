const jestExpect = require('expect');

describe('Attributes', () => {
  const expectedText = 'TextView';

  beforeEach(async () => {
    await device.reloadReactNative();
    await element(by.text('Attributes')).tap();
  });

  it('should get common attributes for view', async () => {
    const attribs = await element(by.id('viewId')).getAttributes();
    jestExpect(attribs.visible).toBe(true);
    jestExpect(attribs.enabled).toBe(true);
  });

  it(':android: should get attributes for view', async () => {
    const attribs = await element(by.id('viewId')).getAttributes();

    jestExpect(attribs.alpha).toBe(1);
    jestExpect(attribs.visibility).toBe("visible");
    jestExpect(attribs.elevation).toBe(0);
    jestExpect(attribs.height).toBe(263);
    jestExpect(attribs.width).toBe(263);
    jestExpect(attribs.focused).toBe(false);
  });

  it('should get common attributes for simple text', async () => {
    const attribs = await element(by.id('textViewId')).getAttributes();
    jestExpect(attribs.text).toBe(expectedText);
    jestExpect(attribs.label).toBe(expectedText);
  });

  it(':android: should get attributes for simple text', async () => {
    const attribs = await element(by.id('textViewId')).getAttributes();

    jestExpect(attribs.text).toBe(expectedText);
    jestExpect(attribs.length).toBe(expectedText.length);
    jestExpect(attribs.textSize).toBe(37.0);
  });

  it(':android: should get attributes for text-input', async () => {
    let attribs = await element(by.id('blurredTextInputId')).getAttributes();
    jestExpect(attribs.focused).toEqual(false);
    jestExpect(attribs.text).toEqual('blurred');

    attribs = await element(by.id('focusedTextInputId')).getAttributes();
    jestExpect(attribs.focused).toEqual(true);
    jestExpect(attribs.text).toEqual('focused');
    jestExpect(attribs.placeholder).toEqual('palace-holder');
  });

  it(':android: should get attributes for checkbox', async () => {
    let attribs = await element(by.id('checkboxId')).getAttributes();
    jestExpect(attribs.value).toBe(false);

    await element(by.id('checkboxId')).tap();
    attribs = await element(by.id('checkboxId')).getAttributes();
    jestExpect(attribs.value).toBe(true);
  });

  it(':android: should get attributes for slider', async () => {
    const attribs = await element(by.id('sliderId')).getAttributes();
    jestExpect(attribs.value).toEqual(0.5 * 128); // Why 1 is 128 in RN? I'm not sure... maybe px vs. dp?! :shrug:
  });
});
