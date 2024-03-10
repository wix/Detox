const {expectElementSnapshotToMatch} = require("./utils/snapshot");
const jestExpect = require('expect').default;

describe('Web View', () => {
  beforeEach(async () => {
    await device.reloadReactNative();
    await element(by.text('WebView')).tap();
  });

  describe('single web-view scenario', () => {
    const expectWebViewToMatchSnapshot = async (snapshotName) => {
      const webViewElement = element(by.id('webViewFormWithScrolling'));
      await expectElementSnapshotToMatch(webViewElement, snapshotName);
    };

    describe('matchers', () => {
      it('should find element by id', async () => {
        await expect(web.element(by.web.id('pageHeadline'))).toExist();
      });

      it('should find element by tag', async () => {
        await expect(web.element(by.web.tag('body'))).toExist();
      });

      it('should find element by index', async () => {
        await expect(web.element(by.web.tag('p')).atIndex(0)).toExist();
      });

      it('should not find element by invalid index', async () => {
        await expect(web.element(by.web.tag('p')).atIndex(100)).not.toExist();
      });

      it('should raise an error when does element not exists at index', async () => {
        await jestExpect(async () => {
          await expect(web.element(by.web.tag('p')).atIndex(100)).toExist();
        }).rejects.toThrowError();
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

      it('should raise an error when element does not exists', async () => {
        await jestExpect(async () => {
          await expect(web.element(by.web.id('nonExistentElement'))).toExist();
        }).rejects.toThrowError();
      });

      it('should assert that an element is not visible', async () => {
        await expect(web.element(by.web.id('nonExistentElement'))).not.toExist();
      });
    });

    describe('actions', () => {
      describe('input', () => {
        const inputElement = web.element(by.web.id('fname'));

        it('should type text in input', async () => {
          await inputElement.typeText('Test');
          await inputElement.typeText('er');

          await expect(inputElement).toHaveText('Tester');
        });

        it(':ios: should type text in input regardless of content-editable parameter on ios', async () => {
          await inputElement.typeText('Test', false);
          await inputElement.typeText('er', true);

          await expect(inputElement).toHaveText('Tester');
        });

        it('should clear text in input', async () => {
          await inputElement.typeText('Test');
          await inputElement.clearText();

          await expect(inputElement).toHaveText('');
        });

        it('should replace text in input', async () => {
          await inputElement.typeText('Temp');
          await inputElement.replaceText('Tester');

          await expect(inputElement).toHaveText('Tester');
        });

        it('should tap on submit button and update result', async () => {
          await inputElement.typeText('Tester');

          await web.element(by.web.id('submit')).tap();

          await expect(inputElement).toHaveText('Tester');
        });

        it('should select all text in input', async () => {
          await inputElement.typeText('Tester');
          await inputElement.selectAllText();

          await expectWebViewToMatchSnapshot('select-all-text-in-webview');
        });

        it('should focus on input', async () => {
          await inputElement.focus();

          await expectWebViewToMatchSnapshot('focus-on-input-webview');
        });

        it('should move cursor to end', async () => {
          await inputElement.typeText('Tester');
          await inputElement.moveCursorToEnd();

          await expectWebViewToMatchSnapshot('move-cursor-to-end-webview');
        });
      });

      describe('content-editable', () => {
        const contentEditableElement = web.element(by.web.id('contentEditable'));

        it('should type text in content-editable', async () => {
          await contentEditableElement.typeText('Test');
          await contentEditableElement.typeText('er');

          await expect(contentEditableElement).toHaveText('Name: Tester');
        });

        it(':ios: should type text in content-editable regardless of content-editable parameter on ios', async () => {
          await contentEditableElement.typeText('Test', false);
          await contentEditableElement.typeText('er', true);

          await expect(contentEditableElement).toHaveText('Name: Tester');
        });

        it('should clear text in content-editable', async () => {
          await contentEditableElement.clearText();

          await expect(contentEditableElement).toHaveText('');
        });

        it('should replace text in content-editable', async () => {
          await contentEditableElement.replaceText('Tester');

          await expect(contentEditableElement).toHaveText('Tester');
        });

        it('should select all text in content-editable', async () => {
          await contentEditableElement.selectAllText();

          await expectWebViewToMatchSnapshot('select-all-text-in-content-editable-webview');
        });

        it('should focus on content-editable', async () => {
          await contentEditableElement.focus();

          await expectWebViewToMatchSnapshot('focus-on-content-editable-webview');
        });

        it('should move cursor to end', async () => {
          await contentEditableElement.moveCursorToEnd();

          await expectWebViewToMatchSnapshot('move-cursor-to-end-content-editable-webview');
        });
      });

      it('should scroll to view', async () => {
        await web.element(by.web.id('bottomParagraph')).scrollToView();

        await expectWebViewToMatchSnapshot('scroll-to-view-webview');
      });

      it('should run script', async () => {
        const headline = web.element(by.web.id('pageHeadline'));
        await headline.runScript('(el) => { el.textContent = "Changed"; }');

        await expect(headline).toHaveText('Changed');
      });

      it('should run script with arguments', async () => {
        const headline = web.element(by.web.id('pageHeadline'));
        await headline.runScript('(el, text) => { el.textContent = text; }', ['Changed']);

        await expect(headline).toHaveText('Changed');
      });

      it('should return value from run script', async () => {
        const headline = web.element(by.web.id('pageHeadline'));
        const textContent = await headline.runScript('(el) => { return el.textContent; }');

        await jestExpect(textContent).toBe('First Webview');
      });

      it('should raise error when script fails', async () => {
        const headline = web.element(by.web.id('pageHeadline'));

        await jestExpect(async () => {
          await headline.executeScript('(el) => { el.textContent = "Changed"; throw new Error("Error"); }');
        }).rejects.toThrowError();
      });
    });

    describe('getters', () => {
      it('should get the web page title', async () => {
        const title = await web.element(by.web.tag('body')).getTitle();
        await jestExpect(title).toBe('First Webview');
      });

      it('should get the web page url', async () => {
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

  describe('multiple web-views scenario',() => {
    /** @type {Detox.WebViewElement} */
    let webview;

    beforeEach(async () => {
      await element(by.id('toggleDummyWebViewButton')).tap();

      webview = web(by.id('dummyWebView'));
    });

    it('should have a title', async () => {
      const title = await webview.element(by.web.tag('body')).getTitle();
      await jestExpect(title).toBe('Dummy Webview');
    });

    it('should have a paragraph', async () => {
      await expect(webview.element(by.web.id('message'))).toExist();
      await expect(webview.element(by.web.id('message'))).toHaveText('This is a dummy webview.');
    });

    it('should throw on multiple matches', async () => {
      await element(by.id('toggleDummyWebView2Button')).tap();

      await jestExpect(async () => {
        await expect(web(by.id('dummyWebView')).element(by.web.id('message'))).toExist();
      }).rejects.toThrowError();
    });

    describe('at-index support', () => {
      beforeEach(async () => {
        await element(by.id('toggleDummyWebView2Button')).tap();
      });

      it.only(':ios: should find web-view by index', async () => {
        await expect(web(by.id('dummyWebView')).atIndex(0).element(by.web.id('message'))).toExist();
        await expect(web(by.id('dummyWebView')).atIndex(1).element(by.web.id('message'))).toExist();
      });

      it(':ios: should throw on index out of bounds', async () => {
        await jestExpect(async () => {
          await expect(web(by.id('dummyWebView')).atIndex(2).element(by.web.id('message'))).toExist();
        }).rejects.toThrowError();

        await device.launchApp();
      });

      it(':android: should throw on usage of atIndex', async () => {
        await jestExpect(async () => {
          await expect(web(by.id('dummyWebView')).atIndex(0).element(by.web.id('message'))).toExist();
        }).rejects.toThrowError();
      });
    });
  });
});
