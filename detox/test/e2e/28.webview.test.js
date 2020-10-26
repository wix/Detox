describe('WebView', () => {
  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('should set input and change text', async () => {
    //detox
    await element(by.text('WebView')).tap();

    //detox web
    const webview = await web.getWebView();
    const textInput = await webview.element(web.by.id('textInput'));

    await textInput.scrollToView();
    await textInput.tap();
    await textInput.typeText("EspressoWeb");
  });

  it.only('should not find element', async () => {
    //detox
    await element(by.text('WebView')).tap();

    //detox web
    const webview = await web.getWebView();
    const textInput = await webview.element(web.by.id('id_not_found'));

    await textInput.tap();
  });

});
