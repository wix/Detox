const MOCK_TEXT = 'Mock Text';

describe(':android: WebView', () => {

  beforeEach(async () => {
    await device.reloadReactNative();
    //detox
    await element(by.text('WebView')).tap();
  });

  async function getWebView(matcher) {
    return web.getWebView(matcher !== undefined ? matcher : by.id('webview_1'));
  }

  describe('Expectations',() => {
    it('expect element to exists', async () => {
      //detox web
      webview = await getWebView();

      await web.expect(webview.element(web.by.id('testingPar'))).toExist();
    });

    it('expect element to NOT exists', async () => {
      //detox web
      webview = await getWebView();

      await web.expect(webview.element(web.by.id('not_found'))).not.toExist();
    });

    it('expect element to have text', async () => {
      //detox web
      webview = await getWebView();

      await web.expect(webview.element(web.by.id('testingPar'))).toHaveText('Message');
    });


    it('expect element to NOT have text', async () => {
      //detox web
      webview = await getWebView();

      await web.expect(webview.element(web.by.id('testingPar'))).not.toHaveText(MOCK_TEXT);
    });
  });

  describe('Element Matchers',() => {
    it('expect to find element by id', async () => {
      //detox web
      webview = await getWebView();
      await web.expect(webview.element(web.by.id('testingh1'))).toExist();
    });

    it('expect to find element by className', async () => {
      //detox web
      webview = await getWebView();
      await web.expect(webview.element(web.by.className('a'))).toExist();
    });

    it('expect to find element by cssSelector', async () => {
      //detox web
      webview = await getWebView();
      await web.expect(webview.element(web.by.cssSelector('#cssSelector'))).toExist();
    });

    it('expect to find element by name', async () => {
      //detox web
      webview = await getWebView();
      await web.expect(webview.element(web.by.name('sec_input'))).toExist();
    });

    it('expect to find element by xpath', async () => {
      //detox web
      webview = await getWebView();
      await web.expect(webview.element(web.by.xpath('//*[@id="testingh1-1"]'))).toExist();
    });

    it('expect to find element by linkText', async () => {
      //detox web
      webview = await getWebView();
      await web.expect(webview.element(web.by.linkText('disney.com'))).toExist();
    });

    it('expect to find element by partialLinkText', async () => {
      //detox web
      webview = await getWebView();
      await web.expect(webview.element(web.by.partialLinkText('disney'))).toExist();
    });

    it('expect to find element by tag', async () => {
      //detox web
      webview = await getWebView();
      await web.expect(webview.element(web.by.tag('mark'))).toExist();
    });
  });

  describe('ContentEditable', () => {

    it('should replace text by selecting all text', async () => {
        //detox web
        webview = await getWebView();
        const editable = await webview.element(web.by.className('public-DraftEditor-content'));
        const text = await editable.getText();

        await editable.scrollToView();
        await editable.selectAllText();

        //tapping, (at the moment not working on content-editable)
        const uiDevice = device.getUiDevice();
        await uiDevice.click(40, 150);

        await editable.typeText(MOCK_TEXT, true);

        await web.expect(editable).not.toHaveText(text);
        await web.expect(editable).toHaveText(MOCK_TEXT);
    });

    it('move cursor to end and add text', async () => {
      //detox web
      webview = await getWebView();
      const editable = await webview.element(web.by.className('public-DraftEditor-content'));
      await editable.scrollToView();

      //tapping, (at the moment not working on content-editable)
      const uiDevice = device.getUiDevice();
      await uiDevice.click(40, 150);

      //Initial Text
      await editable.selectAllText();
      await editable.typeText(MOCK_TEXT, true);

      //Addition Text
      const ADDITION_TEXT = ' AdditionText';
      await editable.moveCursorToEnd();
      await editable.typeText(ADDITION_TEXT, true);

      await web.expect(editable).toHaveText(MOCK_TEXT + ADDITION_TEXT);
    });
  });

  it('should set input and change text', async () => {
    //detox web
    webview = await getWebView();

    // Verify initial value
    const para = webview.element(web.by.id('testingPar'));
    await web.expect(para).toHaveText('Message');

    const textInput = await webview.element(web.by.id('textInput'));
    await textInput.scrollToView();
    await textInput.tap();
    await textInput.typeText(MOCK_TEXT);

    await webview.element(web.by.id('changeTextBtn')).tap();
    // Verify text updated
    await web.expect(para).toHaveText(MOCK_TEXT);
  });

  it('should header get text and verify its value', async () => {
    //detox web
    webview = await getWebView();
    const text = await webview.element(web.by.id('testingh1')).getText();

    const textInput = await webview.element(web.by.id('textInput'));
    await textInput.scrollToView();
    await textInput.tap();
    await textInput.typeText(text);

    await webview.element(web.by.id('changeTextBtn')).tap();

    // Verify text is the title text
    await web.expect(webview.element(web.by.id('testingPar'))).toHaveText(text);

  });

  it('should replace text', async () => {
    //detox web
    webview = await getWebView();

    const textInput = await webview.element(web.by.id('textInput'));
    await textInput.scrollToView();
    await textInput.tap();
    await textInput.typeText('first text');

    await webview.element(web.by.id('changeTextBtn')).tap();
    await web.expect(webview.element(web.by.id('testingPar'))).toHaveText('first text');

    await textInput.replaceText(MOCK_TEXT);
    await webview.element(web.by.id('changeTextBtn')).tap();
    //Verify para value is the latest changed text
    await web.expect(webview.element(web.by.id('testingPar'))).toHaveText(MOCK_TEXT);
  });

  it('getWebView with matcher id', async () => {
    //detox web
    webview = await getWebView(by.id('webview_2'));
    await web.expect(webview.element(web.by.tag('p'))).toHaveText('Second Webview');
  });

});
