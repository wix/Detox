const driver = {
  navToScreen: async () => {
    await device.reloadReactNative();
    await element(by.text('Assertions')).tap();
  },
  get textElement() { return element(by.id('main-text')) },
  get subtextElement() { return element(by.id('subtext-root')) },
  get invisibleTextElement() { return element(by.id('offscreen-text')) },
  get toggleElement() { return element(by.id('toggle')) },
}

describe('Assertions', () => {
  beforeEach(async () => {
    await driver.navToScreen();
  });

  it('should assert an element is visible', async () => {
    await expect(driver.textElement).toBeVisible();
  });

  it('should assert an element is not visible', async () => {
    await expect(driver.invisibleTextElement).not.toBeVisible();
  });

  it('should assert an element exists', async () => {
    await expect(driver.invisibleTextElement).toExist();
  });

  it('should assert an element does not exist', async () => {
    await expect(element(by.id('RandomJunk959'))).not.toExist();
  });

  it('should assert an element has text', async () => {
    await expect(driver.textElement).toHaveText('I contain some text');
  });

  it('should assert an element has (accessibility) label', async () => {
    await expect(driver.textElement).toHaveLabel('I contain some text');
  });

  it('should assert a sub-element has a computed (accessibility) label', async () => {
    await expect(driver.subtextElement).toHaveLabel('This is some subtext');
  });

  it('should assert an element has (accessibility) id', async () => {
    await expect(element(by.text('I contain some text'))).toHaveId('main-text');
  });

  it.skip(':ios: should assert an element has (accessibility) value', async () => {
    await expect(driver.toggleElement).toHaveValue('0');
    await driver.toggleElement.tap();
    await expect(driver.toggleElement).toHaveValue('1');
  });

  it('assert toggle-switch widget', async () => {
    await expect(driver.toggleElement).toHaveToggleValue(false);
    await driver.toggleElement.tap();
    await expect(driver.toggleElement).toHaveToggleValue(true);
    await expect(driver.toggleElement).not.toHaveToggleValue(false);
  });
});
