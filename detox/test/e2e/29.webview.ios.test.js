const MOCK_TEXT = 'Mock Text';

describe(':ios: WebView', () => {
  let webview;

  beforeEach(async () => {
    await device.reloadReactNative();
    await element(by.text('WebView')).tap();
    webview = web(by.id('webview_id'));
  });

  describe('Element Matchers',() => {
    it('expect to find element by label', async () => {
      await expect(webview.element(by.web.label('testingh1'))).toExist();
    });

    it('expect to find element by value', async () => {
      await expect(webview.element(by.web.value('a'))).toExist();
    });
  });
});
