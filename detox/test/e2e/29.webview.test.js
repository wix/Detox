const custom = require('./utils/custom-it');
const MOCK_TEXT = 'Mock Text';

describe('WebView', () => {
  beforeEach(async () => {
    await device.reloadReactNative();
    await element(by.text('WebView')).tap();
  });

  describe('Expectations',() => {
    it('expect element to exists', async () => {
      await expect(web.element(by.web.id('testingPar'))).toExist();
    });

    it('expect element to NOT exists', async () => {
      await expect(web.element(by.web.id('not_found'))).not.toExist();
    });

    it('expect element to have text', async () => {
      await expect(web.element(by.web.id('testingPar'))).toHaveText('Message');
    });

    it('expect element to NOT have text', async () => {
      await expect(web.element(by.web.id('testingPar'))).not.toHaveText(MOCK_TEXT);
    });
  });

  describe('Element Matchers',() => {
    custom.it.withFailureIf.android('expect to find element by label', async () => {
      await expect(web.element(by.web.label('Testing '))).toExist();
    });

    custom.it.withFailureIf.android('expect to find element by value at index', async () => {
      await expect(web.element(by.web.value('1')).atIndex(1)).toExist();
    });

    it('expect to find element by id', async () => {
      await expect(web.element(by.web.id('testingh1'))).toExist();
    });

    it('expect to find element by class name', async () => {
      await expect(web.element(by.web.className('a'))).toExist();
    });

    it('expect to find element by css selector', async () => {
      await expect(web.element(by.web.cssSelector('#cssSelector'))).toExist();
    });

    it('expect to find element by name', async () => {
      await expect(web.element(by.web.name('sec_input'))).toExist();
    });

    it('expect to find element by xpath', async () => {
      await expect(web.element(by.web.xpath('//*[@id="testingh1-1"]'))).toExist();
    });

    custom.it.withFailureIf.ios('expect to find element by href without `http://`', async () => {
      await expect(web.element(by.web.href('disney.com'))).toExist();
    });

    it('expect to find element by full href', async () => {
      await expect(web.element(by.web.href('http://www.disney.com'))).toExist();
    });

    it('expect to find element by hrefContains', async () => {
      await expect(web.element(by.web.hrefContains('disney'))).toExist();
    });

    it('expect to find element by tag name', async () => {
      await expect(web.element(by.web.tag('mark'))).toExist();
    });
  });

  describe('ContentEditable', () => {

    it('should replace text by selecting all text', async () => {
        const editable = await web.element(by.web.className('public-DraftEditor-content'));
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

    it('move cursor to end and add text', async () => {
      const editable = await web.element(by.web.className('public-DraftEditor-content'));
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

  describe('Actions', () => {
    it('should set input and change text', async () => {
      // Verify initial value
      const para = web.element(by.web.id('testingPar'));
      await expect(para).toHaveText('Message');

      const textInput = await web.element(by.web.id('textInput'));
      await textInput.scrollToView();
      await textInput.tap();
      await textInput.typeText(MOCK_TEXT);

      await web.element(by.web.id('changeTextBtn')).tap();
      // Verify text updated
      await expect(para).toHaveText(MOCK_TEXT);
    });

    it('should header get text and verify its value', async () => {
      const text = await web.element(by.web.id('testingh1')).getText();

      const textInput = await web.element(by.web.id('textInput'));
      await textInput.scrollToView();
      await textInput.tap();
      await textInput.typeText(text);

      await web.element(by.web.id('changeTextBtn')).tap();

      // Verify text is the title text
      await expect(web.element(by.web.id('testingPar'))).toHaveText(text);

    });

    it('should replace text', async () => {
      const textInput = await web.element(by.web.id('textInput'));
      await textInput.scrollToView();
      await textInput.tap();
      await textInput.typeText('first text');

      await web.element(by.web.id('changeTextBtn')).tap();
      await expect(web.element(by.web.id('testingPar'))).toHaveText('first text');

      await textInput.replaceText(MOCK_TEXT);
      await web.element(by.web.id('changeTextBtn')).tap();

      // Verify param value is the latest changed text
      await expect(web.element(by.web.id('testingPar'))).toHaveText(MOCK_TEXT);
    });
  });
});
