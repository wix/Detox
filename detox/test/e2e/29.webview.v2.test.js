const {expectElementSnapshotToMatch} = require("./utils/snapshot");
const jestExpect = require('expect').default;

describe('Web View', () => {
  beforeEach(async () => {
    await device.reloadReactNative();
    await element(by.text('WebView V2')).tap();
  });

  describe('default view', () => {
    describe('matchers', () => {
      it('should find element by id', async () => {
        await expect(web.element(by.web.id('pageHeadline'))).toExist();
      });

      it('should find element by tag', async () => {
        await expect(web.element(by.web.tag('body'))).toExist();
      });

      it('should find element by class name', async () => {
        await expect(web.element(by.web.className('specialParagraph'))).toExist();
      });

      it('should find element by css selector', async () => {
        await expect(web.element(by.web.cssSelector('.specialParagraph'))).toExist();
      });

      it('should find element by xpath', async () => {
        await expect(web.element(by.web.xpath('//p[@class="specialParagraph"]'))).toExist();
      });

      it('should find element by hrefContains', async () => {
        await expect(web.element(by.web.hrefContains('w3schools'))).toExist();
      });

      it('should find element by href', async () => {
        await expect(web.element(by.web.href('https://www.w3schools.com'))).toExist();
      });

      it('should find element by name', async () => {
        await expect(web.element(by.web.name('fname'))).toExist();
      });

      it('should raise an error when element not exists', async () => {
        try {
          await expect(web.element(by.web.id('nonExistentElement'))).toExist();
        } catch (error) {
          await jestExpect(error).toBeDefined();
        }
      });

      it('should assert that an element is not visible', async () => {
        await expect(web.element(by.web.id('nonExistentElement'))).not.toExist();
      });
    });

    describe('actions', () => {
      it('should type text in input', async () => {
        await web.element(by.web.id('fname')).typeText('Test');
        await web.element(by.web.id('fname')).typeText('er');

        await expect(web.element(by.web.id('fname'))).toHaveText('Tester');
      });

      it('should clear text in input', async () => {
        await web.element(by.web.id('fname')).typeText('Test');
        await web.element(by.web.id('fname')).clearText();

        await expect(web.element(by.web.id('fname'))).toHaveText('');
      });

      it('should replace text in input', async () => {
        await web.element(by.web.id('fname')).typeText('Test');
        await web.element(by.web.id('fname')).replaceText('Tester');

        await expect(web.element(by.web.id('fname'))).toHaveText('Tester');
      });

      it('should tap on submit button', async () => {
        await web.element(by.web.id('fname')).typeText('Tester');

        await web.element(by.web.id('submit')).tap();

        await expect(web.element(by.web.id('resultFname'))).toHaveText('Tester');
      });

      // selectAllText action
      it('should select all text in input', async () => {
        await web.element(by.web.id('fname')).typeText('Tester');
        await web.element(by.web.id('fname')).selectAllText();

        const webViewElement = element(by.id('webViewFormWithScrolling'));
        await expectElementSnapshotToMatch(webViewElement, 'select-all-text-in-webview');
      });

      it.skip('should scroll to view', async () => {
        await web.element(by.web.id('bottomParagraph')).scrollToView();

        const webViewElement = element(by.id('webViewFormWithScrolling'));
        await expectElementSnapshotToMatch(webViewElement, 'scroll-to-view-webview');
      });

      it('should focus on input', async () => {
        await web.element(by.web.id('fname')).focus();

        const webViewElement = element(by.id('webViewFormWithScrolling'));
        await expectElementSnapshotToMatch(webViewElement, 'focus-on-input-webview');
      });

      it('should move cursor to end', async () => {
        await web.element(by.web.id('fname')).typeText('Tester');
        await web.element(by.web.id('fname')).moveCursorToEnd();

        const webViewElement = element(by.id('webViewFormWithScrolling'));
        await expectElementSnapshotToMatch(webViewElement, 'move-cursor-to-end-webview');
      });

      it.skip('should run script', async () => {
        const headline = web.element(by.web.id('pageHeadline'));
        await headline.runScript('(el) => { el.textContent = "Changed"; }');

        await expect(headline).toHaveText('Changed');
      });

      it.skip('should run script with arguments', async () => {
        const headline = web.element(by.web.id('pageHeadline'));
        await headline.runScript('(el, text) => { el.textContent = text; }', 'Changed');

        await expect(headline).toHaveText('Changed');
      });

      it('should raise error when script fails', async () => {
        const headline = web.element(by.web.id('pageHeadline'));
        try {
          await headline.executeScript('(el) => { el.textContent = "Changed"; throw new Error("Error"); }');
        } catch (error) {
          await jestExpect(error).toBeDefined();
        }
      });
    });

    describe('getters', () => {
      it('should get the web page title', async () => {
        const title = await web.element(by.web.tag('body')).getTitle();
        await jestExpect(title).toBe('First Webview');
      });

      it.skip('should get the web page url', async () => {
        await web.element(by.web.href('https://www.w3schools.com')).tap();

        // Sleep for a second to allow the web page to load.
        await new Promise((resolve) => setTimeout(resolve, 1000));

        const url = await web.element(by.web.tag('body')).getCurrentUrl();

        await jestExpect(url).toBe('https://www.w3schools.com/');
      });

      it('should get text from element', async () => {
        const source = await web.element(by.web.id('pageHeadline')).getText();
        await jestExpect(source).toBe('First Webview');
      });
    });
  });

  describe('with native matcher',() => {
    /** @type {Detox.WebViewElement} */
    let webview;

    beforeEach(async () => {
      webview = web(by.id('dummyWebView'));
    });

    it('should have a title', async () => {
      const title = await webview.element(by.web.tag('body')).getTitle();
      await jestExpect(title).toBe('Second Webview');
    });

    it('should have a paragraph', async () => {
      await expect(webview.element(by.web.id('secondWebview'))).toExist();
      await expect(webview.element(by.web.id('secondWebview'))).toHaveText('This is the second webview');
    });
  });
});
