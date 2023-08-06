const MOCK_TEXT = 'Mock Text';

describe(':ios: WebView', () => {
  beforeEach(async () => {
    await device.reloadReactNative();
    await element(by.text('WebView')).tap();
  });

  describe('Element Matchers',() => {
    it('expect to find element by label', async () => {
      await expect(web.element(by.web.label('Testing '))).toExist();
    });

    it('expect to find element by value at index', async () => {
      await expect(web.element(by.web.value('1')).atIndex(1)).toExist();
    });
  });
});
