describe('WebView', () => {
  beforeEach(async () => {
    await device.reloadReactNative();
    // await element(by.text('WebView')).tap();
  });

  it('should enter webview screen', async () => {
    await element(by.text('WebView')).tap();
    console.log("global", global);
    // const webview = await web.getWebView(web.by('webview_1'));
    // console.log(webview);
  });

});
