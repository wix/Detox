describe('WebView', () => {
  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('should set input and change text', async () => {
    await element(by.text('WebView')).tap();
    const webview = await web.getWebView(web.by.id('webview_1'));
    const textInput = await webview.element(web.by.id('textInput'));
    await textInput.scrollToView();
    await textInput.tap();
    await textInput.typeText("EspressoWeb");
  });

});
