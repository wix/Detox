const jestExpect = require('expect').default;
const MOCK_TEXT = 'Mock Text';

describe('Web View', () => {
  /** @type {Detox.WebViewElement} */
  let webview_1;

  beforeEach(async () => {
    await device.reloadReactNative();
    await element(by.text('WebViewV2')).tap();
    webview_1 = web(by.id('webview_1'));
  });

  describe('Expectations',() => {
    it('expect element to exists', async () => {
      await expect(webview_1.element(by.web.id('testingPar'))).toExist();
    });

    it('expect element to NOT exists', async () => {
      await expect(webview_1.element(by.web.id('not_found'))).not.toExist();
    });

    it('expect element to have text', async () => {
      await expect(webview_1.element(by.web.id('testingPar'))).toHaveText('Message');
    });

    it('expect element to NOT have text', async () => {
      await expect(webview_1.element(by.web.id('testingPar'))).not.toHaveText(MOCK_TEXT);
    });
  });

  describe('Element Matchers',() => {
    it('expect to find element by id', async () => {
      await expect(webview_1.element(by.web.id('testingh1'))).toExist();
    });

    it('expect to find element by class name', async () => {
      await expect(webview_1.element(by.web.className('a'))).toExist();
    });

    it('expect to find element by css selector', async () => {
      await expect(webview_1.element(by.web.cssSelector('#cssSelector'))).toExist();
    });

    it('expect to find element by name', async () => {
      await expect(webview_1.element(by.web.name('sec_input'))).toExist();
    });

    it('expect to find element by xpath', async () => {
      await expect(webview_1.element(by.web.xpath('//*[@id="testingh1-1"]'))).toExist();
    });

    it('expect to find element by href', async () => {
      await expect(webview_1.element(by.web.href('http://www.disney.com'))).toExist();
    });

    it('expect to find element by hrefContains', async () => {
      await expect(webview_1.element(by.web.hrefContains('disney'))).toExist();
    });

    it('expect to find element by tag name', async () => {
      await expect(webview_1.element(by.web.tag('mark'))).toExist();
    });
  });

  describe('Script injection', () => {
    it('should execute script', async () => {
      const link = webview_1.element(by.web.cssSelector('#cssSelector'));
      await link.runScript('(el) => { el.textContent = "Changed"; }');
      await expect(link).toHaveText('Changed');
    });

    it('should throw error if script fails', async () => {
      const link = webview_1.element(by.web.cssSelector('#cssSelector'));

      function throwError(_, msg = 'Simulated Error') {
        throw new Error(msg);
      }

      await jestExpect(link.runScript(throwError)).rejects.toThrowError(/Simulated Error/);

      await jestExpect(link.runScript(throwError, ['Custom Error'])).rejects.toThrowError(/Custom Error/);
    });

    it('should evaluate a script with complex args', async () => {
      const link = webview_1.element(by.web.cssSelector('#cssSelector'));
      const evaluationResult = await link.runScript(function (element, a, b, c, d) {
        const newText = a[0] + b.a + c[0].b + d.c[0];
        element.textContent = newText;
        return a.concat({ ...b, ...c[0], ...d });
      }.toString(), [['1'], {a: 8}, [{b: 4}], {c: [3]}]);
      jestExpect(evaluationResult).toEqual(['1', { a: 8, b: 4, c: [3] }]);

      await expect(link).toHaveText('1843');
    });
  });

  describe('ContentEditable', () => {
    it(':android: should replace text by selecting all text', async () => {
        const editable = await webview_1.element(by.web.className('public-DraftEditor-content'));
        const text = await editable.getText();

        await editable.scrollToView();
        await editable.selectAllText();

        //tapping, (at the moment not working on content-editable)
        const uiDevice = device.getUiDevice();
        await uiDevice.click(40, 150);

        await editable.typeText(MOCK_TEXT, true);

        await expect(editable).not.toHaveText(text);
        await expect(editable).toHaveText(MOCK_TEXT);
    });

    it(':android: should move cursor to end and add text', async () => {
      const editable = await webview_1.element(by.web.className('public-DraftEditor-content'));
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

      await expect(editable).toHaveText(MOCK_TEXT + ADDITION_TEXT);
    });
  });

  it('should set input and change text', async () => {
    // Verify initial value
    const para = webview_1.element(by.web.id('testingPar'));
    await expect(para).toHaveText('Message');

    const textInput = await webview_1.element(by.web.id('textInput'));
    await textInput.scrollToView();
    await textInput.tap();
    await textInput.typeText(MOCK_TEXT);

    await webview_1.element(by.web.id('changeTextBtn')).tap();
    // Verify text updated
    await expect(para).toHaveText(MOCK_TEXT);
  });

  it('should header get text and verify its value', async () => {
    const text = await webview_1.element(by.web.id('testingh1')).getText();

    const textInput = await webview_1.element(by.web.id('textInput'));
    await textInput.scrollToView();
    await textInput.tap();
    await textInput.typeText(text);

    await webview_1.element(by.web.id('changeTextBtn')).tap();

    // Verify text is the title text
    await expect(webview_1.element(by.web.id('testingPar'))).toHaveText(text);

  });

  it('should replace text', async () => {
    const textInput = await webview_1.element(by.web.id('textInput'));
    await textInput.scrollToView();
    await textInput.tap();
    await textInput.typeText('first text');

    await webview_1.element(by.web.id('changeTextBtn')).tap();
    await expect(webview_1.element(by.web.id('testingPar'))).toHaveText('first text');

    await textInput.replaceText(MOCK_TEXT);
    await webview_1.element(by.web.id('changeTextBtn')).tap();

    // Verify param value is the latest changed text
    await expect(webview_1.element(by.web.id('testingPar'))).toHaveText(MOCK_TEXT);
  });

  it('getWebView with matcher id', async () => {
    const webview_2 = await web(by.id('webview_2'));
    await expect(webview_2.element(by.web.tag('p'))).toHaveText('Second Webview');
  });
});
