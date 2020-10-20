describe('WebView', () => {
  beforeEach(async () => {
    await device.reloadReactNative();
    // await element(by.text('WebView')).tap();
  });

  it('should enter webview screen', async () => {
    await element(by.text('WebView')).tap();
    // console.log(global);
    //console.log(web);
    const webview = await web.getWebView(web.by.id('webview_1'));
    webview.element(web.by.id('textInput')).tap();
    // console.log(textInput);
  });

});
