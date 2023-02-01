describe('Assertions', () => {
  beforeEach(async () => {
    await device.reloadReactNative();
    await element(by.text('Assertions')).tap();
  });

  it('should assert an element is visible', async () => {
    await expect(element(by.id('UniqueId204'))).toBeVisible();
  });

  it('should assert an element is not visible', async () => {
    await expect(element(by.id('UniqueId205'))).not.toBeVisible();
  });

  // prefer toBeVisible to make sure the user actually sees this element
  it('should assert an element exists', async () => {
    await expect(element(by.id('UniqueId205'))).toExist();
  });

  it('should assert an element does not exist', async () => {
    await expect(element(by.id('RandomJunk959'))).not.toExist();
  });

  // matches specific text elements like UIButton, UILabel, UITextField or UITextView, RCTText
  it('should assert an element has text', async () => {
    await expect(element(by.id('UniqueId204'))).toHaveText('I contain some text');
  });

  // matches by accessibility label, this might not be the specific displayed text but is much more generic
  it('should assert an element has (accessibility) label', async () => {
    await expect(element(by.id('UniqueId204'))).toHaveLabel('I contain some text');
  });

  it('should assert an element has (accessibility) id', async () => {
    await expect(element(by.text('I contain some text'))).toHaveId('UniqueId204');
  });

  // for example, the value of a UISwitch in the "on" state is "1"
  it.skip(':ios: should assert an element has (accessibility) value', async () => {
    await expect(element(by.id('UniqueId146'))).toHaveValue('0');
    await element(by.id('UniqueId146')).tap();
    await expect(element(by.id('UniqueId146'))).toHaveValue('1');
  });

  it('assert toggle-switch widget', async () => {
    await expect(element(by.id('UniqueId146'))).toHaveToggleValue(false);
    await element(by.id('UniqueId146')).tap();
    await expect(element(by.id('UniqueId146'))).toHaveToggleValue(true);
    await expect(element(by.id('UniqueId146'))).not.toHaveToggleValue(false);
  });

  it('should throw exception for visibility threshold out of range (lower than 1)', async () => {
    try {
      await expect(element(by.text('UniqueId204'))).toBeVisible(0);
    } catch (e) {
      if (!e.toString().includes('must be an integer between 1 and 100')) {
        throw new Exception('should throw exception for visibility out of range');
      }
    }
  });

  it('should throw exception for visibility threshold out of range when negated (lower than 1)', async () => {
    try {
      await expect(element(by.text('UniqueId204'))).not.toBeVisible(0);
    } catch (e) {
      if (!e.toString().includes('must be an integer between 1 and 100')) {
        throw new Exception('should throw exception for visibility out of range');
      }
    }
  });

  it('should throw exception for visibility threshold out of range (greater than 100)', async () => {
    try {
      await expect(element(by.text('UniqueId204'))).toBeVisible(101);
    } catch (e) {
      if (!e.toString().includes('must be an integer between 1 and 100')) {
        throw new Exception('should throw exception for visibility out of range');
      }
    }
  });

  it('should throw exception for visibility threshold out of range when negated (greater than 100)', async () => {
    try {
      await expect(element(by.text('UniqueId204'))).toBeVisible(101);
    } catch (e) {
      if (!e.toString().includes('must be an integer between 1 and 100')) {
        throw new Exception('should throw exception for visibility out of range');
      }
    }
  });
});
