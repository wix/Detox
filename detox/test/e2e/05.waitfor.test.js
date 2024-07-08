const {expectToThrow} = require('./utils/custom-expects');

const expectToFinishBeforeTimeout = async (block, timeout) => {
  const startTime = new Date().getTime();
  await block();
  const endTime = new Date().getTime();

  const expiredAfter = endTime - startTime;
  if (expiredAfter > timeout) {
    throw new Error(`Action not expired even after a timeout, took ${expiredAfter}ms`);
  }
}

describe('WaitFor', () => {
  const goButton = element(by.id('goButton'));
  const timeout = 5000;

  beforeEach(async() => {
    await device.reloadReactNative();
    await element(by.text('WaitFor')).tap();
  });

  it('should wait until an element is exists / removed in layout', async () => {
    let testElement = element(by.id('changeExistenceByToggle'));
    await expect(testElement).not.toExist();

    await goButton.tap();

    await expectToFinishBeforeTimeout(async () => {
      await waitFor(testElement).toExist().withTimeout(timeout);
    }, timeout);

    await goButton.tap();

    await expectToFinishBeforeTimeout(async () => {
      await waitFor(testElement).not.toExist().withTimeout(timeout);
    }, timeout);
  });

  it('should wait until an element is focused / unfocused', async () => {
    let testElement = element(by.id('changeFocusByToggle'));
    await expect(testElement).not.toBeFocused();

    await goButton.tap();

    await expectToFinishBeforeTimeout(async () => {
      await waitFor(testElement).toBeFocused().withTimeout(timeout);
    }, timeout);

    await goButton.tap();

    await expectToFinishBeforeTimeout(async () => {
      await waitFor(testElement).not.toBeFocused().withTimeout(timeout);
    }, timeout);
  });

  it('should find element by scrolling until it is visible', async () => {
    await expect(element(by.text('Text5'))).not.toBeVisible();

    await goButton.tap();
    await waitFor(element(by.text('Text5'))).toBeVisible().whileElement(by.id('ScrollView')).scroll(50, 'down');
    await expect(element(by.text('Text5'))).toBeVisible();
  });

  it('should fail test after waiting for element to exist but it doesn\'t at the end', async () => {
    await expect(element(by.id('neverAppearingText'))).not.toExist();
    await expectToThrow(() => waitFor(element(by.id('neverAppearingText'))).toExist().withTimeout(500));
  });

  it('should abort scrolling if element was not found', async () => {
    await goButton.tap();
    await expectToThrow(() => waitFor(element(by.text('Text1000'))).toBeVisible().whileElement(by.id('ScrollView')).scroll(50, 'down'));
    await expect(element(by.text('Text1000'))).not.toBeVisible();
  });
});
