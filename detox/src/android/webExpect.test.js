describe('webExpect', () => {
  let e;

  let mockExecutor;
  let emitter;
  let device;
  beforeEach(() => {
    jest.mock('tempfile');
    jest.mock('fs-extra');
    jest.mock('../devices/Device.js')

    mockExecutor = new MockExecutor();

    const FakeDevice = jest.genMockFromModule('../devices/__mocks__/Device.js');
    const Emitter = jest.genMockFromModule('../utils/AsyncEmitter');
    emitter = new Emitter();
    device = new FakeDevice();

    const AndroidWebExpect = require('./webExpect');
    e = new AndroidWebExpect(device, {
      invocationManager: mockExecutor,
      emitter,
    });
  });


  describe('WebElement Actions', () => {
    it('tap', async () => {
      await e.getWebView().element(e.by.id('id')).tap();
      await e.getWebView().element(e.by.className('className')).tap();
      await e.getWebView().element(e.by.cssSelector('cssSelector')).tap();
      await e.getWebView().element(e.by.name('name')).tap();
      await e.getWebView().element(e.by.xpath('xpath')).tap();
      await e.getWebView().element(e.by.linkText('linkText')).tap();
      await e.getWebView().element(e.by.partialLinkText('partialLinkText')).tap();
      await e.getWebView().element(e.by.tag('tag')).tap();
    });

    it('typeText', async () => {
      await e.getWebView().element(e.by.id('textInput')).typeText('text', false);
      await e.getWebView().element(e.by.id('id')).typeText('text', false);
      await e.getWebView().element(e.by.className('className')).typeText('text', false);
      await e.getWebView().element(e.by.cssSelector('cssSelector')).typeText('text', false);
      await e.getWebView().element(e.by.name('name')).typeText('text', false);
      await e.getWebView().element(e.by.xpath('xpath')).typeText('text', false);
      await e.getWebView().element(e.by.linkText('linkText')).typeText('text', false);
      await e.getWebView().element(e.by.partialLinkText('partialLinkText')).typeText('text', false);
      await e.getWebView().element(e.by.tag('tag')).typeText('text', false);
    });

    it('typeText', async () => {
      await e.getWebView().element(e.by.id('id')).typeText('text', true);
      await e.getWebView().element(e.by.className('className')).typeText('text', true);
      await e.getWebView().element(e.by.cssSelector('cssSelector')).typeText('text', true);
      await e.getWebView().element(e.by.name('name')).typeText('text', true);
      await e.getWebView().element(e.by.xpath('xpath')).typeText('text', true);
      await e.getWebView().element(e.by.linkText('linkText')).typeText('text', true);
      await e.getWebView().element(e.by.partialLinkText('partialLinkText')).typeText('text', true);
      await e.getWebView().element(e.by.tag('tag')).typeText('text', true);
    });

    it('replaceText', async () => {
      await e.getWebView().element(e.by.id('id')).replaceText('text');
      await e.getWebView().element(e.by.className('className')).replaceText('text');
      await e.getWebView().element(e.by.cssSelector('cssSelector')).replaceText('text');
      await e.getWebView().element(e.by.name('name')).replaceText('text');
      await e.getWebView().element(e.by.xpath('xpath')).replaceText('text');
      await e.getWebView().element(e.by.linkText('linkText')).replaceText('text');
      await e.getWebView().element(e.by.partialLinkText('partialLinkText')).replaceText('text');
      await e.getWebView().element(e.by.tag('tag')).replaceText('text');
    });

    it('clearText', async () => {
      await e.getWebView().element(e.by.id('id')).clearText();
      await e.getWebView().element(e.by.className('className')).clearText();
      await e.getWebView().element(e.by.cssSelector('cssSelector')).clearText();
      await e.getWebView().element(e.by.name('name')).clearText();
      await e.getWebView().element(e.by.xpath('xpath')).clearText();
      await e.getWebView().element(e.by.linkText('linkText')).clearText();
      await e.getWebView().element(e.by.partialLinkText('partialLinkText')).clearText();
      await e.getWebView().element(e.by.tag('tag')).clearText();
    });

    it('scrollToView', async () => {
      await e.getWebView().element(e.by.id('id')).scrollToView();
      await e.getWebView().element(e.by.className('className')).scrollToView();
      await e.getWebView().element(e.by.cssSelector('cssSelector')).scrollToView();
      await e.getWebView().element(e.by.name('name')).scrollToView();
      await e.getWebView().element(e.by.xpath('xpath')).scrollToView();
      await e.getWebView().element(e.by.linkText('linkText')).scrollToView();
      await e.getWebView().element(e.by.partialLinkText('partialLinkText')).scrollToView();
      await e.getWebView().element(e.by.tag('tag')).scrollToView();
    });

    it('getText', async () => {
      await e.getWebView().element(e.by.id('id')).getText();
      await e.getWebView().element(e.by.className('className')).getText();
      await e.getWebView().element(e.by.cssSelector('cssSelector')).getText();
      await e.getWebView().element(e.by.name('name')).getText();
      await e.getWebView().element(e.by.xpath('xpath')).getText();
      await e.getWebView().element(e.by.linkText('linkText')).getText();
      await e.getWebView().element(e.by.partialLinkText('partialLinkText')).getText();
      await e.getWebView().element(e.by.tag('tag')).getText();
    });

    it('focus', async () => {
      await e.getWebView().element(e.by.id('id')).focus();
      await e.getWebView().element(e.by.className('className')).focus();
      await e.getWebView().element(e.by.cssSelector('cssSelector')).focus();
      await e.getWebView().element(e.by.name('name')).focus();
      await e.getWebView().element(e.by.xpath('xpath')).focus();
      await e.getWebView().element(e.by.linkText('linkText')).focus();
      await e.getWebView().element(e.by.partialLinkText('partialLinkText')).focus();
      await e.getWebView().element(e.by.tag('tag')).focus();
    });

    it('selectAllText', async () => {
      await e.getWebView().element(e.by.id('id')).selectAllText();
      await e.getWebView().element(e.by.className('className')).selectAllText();
      await e.getWebView().element(e.by.cssSelector('cssSelector')).selectAllText();
      await e.getWebView().element(e.by.name('name')).selectAllText();
      await e.getWebView().element(e.by.xpath('xpath')).selectAllText();
      await e.getWebView().element(e.by.linkText('linkText')).selectAllText();
      await e.getWebView().element(e.by.partialLinkText('partialLinkText')).selectAllText();
      await e.getWebView().element(e.by.tag('tag')).selectAllText();
    });

    it('moveCursorToEnd', async () => {
      await e.getWebView().element(e.by.id('id')).moveCursorToEnd();
      await e.getWebView().element(e.by.className('className')).moveCursorToEnd();
      await e.getWebView().element(e.by.cssSelector('cssSelector')).moveCursorToEnd();
      await e.getWebView().element(e.by.name('name')).moveCursorToEnd();
      await e.getWebView().element(e.by.xpath('xpath')).moveCursorToEnd();
      await e.getWebView().element(e.by.linkText('linkText')).moveCursorToEnd();
      await e.getWebView().element(e.by.partialLinkText('partialLinkText')).moveCursorToEnd();
      await e.getWebView().element(e.by.tag('tag')).moveCursorToEnd();
    });

    it('runScript', async () => {
      const script = 'function foo(el) {}';
      await e.getWebView().element(e.by.id('id')).runScript(script);
      await e.getWebView().element(e.by.className('className')).runScript(script);
      await e.getWebView().element(e.by.cssSelector('cssSelector')).runScript(script);
      await e.getWebView().element(e.by.name('name')).runScript(script);
      await e.getWebView().element(e.by.xpath('xpath')).runScript(script);
      await e.getWebView().element(e.by.linkText('linkText')).runScript(script);
      await e.getWebView().element(e.by.partialLinkText('partialLinkText')).runScript(script);
      await e.getWebView().element(e.by.tag('tag')).runScript(script);
    });

    it('runScriptWithArgs', async () => {
      const script = 'function bar(a,b) {}';
      const argsArr = ['fooA','barB'];
      await e.getWebView().element(e.by.id('id')).runScriptWithArgs(script, argsArr);
      await e.getWebView().element(e.by.className('className')).runScriptWithArgs(script, argsArr);
      await e.getWebView().element(e.by.cssSelector('cssSelector')).runScriptWithArgs(script, argsArr);
      await e.getWebView().element(e.by.name('name')).runScriptWithArgs(script, argsArr);
      await e.getWebView().element(e.by.xpath('xpath')).runScriptWithArgs(script, argsArr);
      await e.getWebView().element(e.by.linkText('linkText')).runScriptWithArgs(script, argsArr);
      await e.getWebView().element(e.by.partialLinkText('partialLinkText')).runScriptWithArgs(script, argsArr);
      await e.getWebView().element(e.by.tag('tag')).runScriptWithArgs(script, argsArr);
    });

    it('getCurrentUrl', async () => {
      await e.getWebView().element(e.by.id('id')).getCurrentUrl();
      await e.getWebView().element(e.by.className('className')).getCurrentUrl();
      await e.getWebView().element(e.by.cssSelector('cssSelector')).getCurrentUrl();
      await e.getWebView().element(e.by.name('name')).getCurrentUrl();
      await e.getWebView().element(e.by.xpath('xpath')).getCurrentUrl();
      await e.getWebView().element(e.by.linkText('linkText')).getCurrentUrl();
      await e.getWebView().element(e.by.partialLinkText('partialLinkText')).getCurrentUrl();
      await e.getWebView().element(e.by.tag('tag')).getCurrentUrl();
    });

    it('getTitle', async () => {
      await e.getWebView().element(e.by.id('id')).getTitle();
      await e.getWebView().element(e.by.className('className')).getTitle();
      await e.getWebView().element(e.by.cssSelector('cssSelector')).getTitle();
      await e.getWebView().element(e.by.name('name')).getTitle();
      await e.getWebView().element(e.by.xpath('xpath')).getTitle();
      await e.getWebView().element(e.by.linkText('linkText')).getTitle();
      await e.getWebView().element(e.by.partialLinkText('partialLinkText')).getTitle();
      await e.getWebView().element(e.by.tag('tag')).getTitle();
    });
  })

  describe('Web Matchers',() => {
      it('by.id', async () => {
        await e.expect(e.getWebView().element(e.by.id('id'))).toExists();
        await e.expect(e.getWebView().element(e.by.id('id'))).toNotExists();
        await e.expect(e.getWebView().element(e.by.id('id'))).toHaveText('text');
        await e.expect(e.getWebView().element(e.by.id('id'))).toNotHaveText('text');
      });

      it('by.className', async () => {
        await e.expect(e.getWebView().element(e.by.className('className'))).toExists();
        await e.expect(e.getWebView().element(e.by.className('className'))).toNotExists();
        await e.expect(e.getWebView().element(e.by.className('className'))).toHaveText('text');
        await e.expect(e.getWebView().element(e.by.className('className'))).toNotHaveText('text');
      });

      it('by.cssSelector', async () => {
        await e.expect(e.getWebView().element(e.by.cssSelector('cssSelector'))).toExists();
        await e.expect(e.getWebView().element(e.by.cssSelector('cssSelector'))).toNotExists();
        await e.expect(e.getWebView().element(e.by.cssSelector('cssSelector'))).toHaveText('text');
        await e.expect(e.getWebView().element(e.by.cssSelector('cssSelector'))).toNotHaveText('text');
      });

      it('by.name', async () => {
        await e.expect(e.getWebView().element(e.by.name('name'))).toExists();
        await e.expect(e.getWebView().element(e.by.name('name'))).toNotExists();
        await e.expect(e.getWebView().element(e.by.name('name'))).toHaveText('text');
        await e.expect(e.getWebView().element(e.by.name('name'))).toNotHaveText('text');
      });

      it('by.xpath', async () => {
        await e.expect(e.getWebView().element(e.by.xpath('xpath'))).toExists();
        await e.expect(e.getWebView().element(e.by.xpath('xpath'))).toNotExists();
        await e.expect(e.getWebView().element(e.by.xpath('xpath'))).toHaveText('text');
        await e.expect(e.getWebView().element(e.by.xpath('xpath'))).toNotHaveText('text');
      });

      it('by.linkText', async () => {
        await e.expect(e.getWebView().element(e.by.linkText('link'))).toExists();
        await e.expect(e.getWebView().element(e.by.linkText('link'))).toNotExists();
        await e.expect(e.getWebView().element(e.by.linkText('link'))).toHaveText('text');
        await e.expect(e.getWebView().element(e.by.linkText('link'))).toNotHaveText('text');
      });

      it('by.partialLinkText', async () => {
        await e.expect(e.getWebView().element(e.by.partialLinkText('lin'))).toExists();
        await e.expect(e.getWebView().element(e.by.partialLinkText('lin'))).toNotExists();
        await e.expect(e.getWebView().element(e.by.partialLinkText('lin'))).toHaveText('text');
        await e.expect(e.getWebView().element(e.by.partialLinkText('lin'))).toNotHaveText('text');
      });

      it('by.tag', async () => {
        await e.expect(e.getWebView().element(e.by.tag('tag'))).toExists();
        await e.expect(e.getWebView().element(e.by.tag('tag'))).toNotExists();
        await e.expect(e.getWebView().element(e.by.tag('tag'))).toHaveText('text');
        await e.expect(e.getWebView().element(e.by.tag('tag'))).toNotHaveText('text');
      });
  });
});


class MockExecutor {
  constructor() {
    this.executeResult = undefined;
  }

  async execute(invocation) {
    if (typeof invocation === 'function') {
      invocation = invocation();
    }
    expect(invocation.target).toBeDefined();
    expect(invocation.target.type).toBeDefined();
    expect(invocation.target.value).toBeDefined();

    this.recurse(invocation);
    await this.timeout(1);
    return this.executeResult ? {
      result: this.executeResult,
    } : undefined;
  }

  recurse(invocation) {
    for (const key in invocation) {
      if (invocation.hasOwnProperty(key)) {
        if (invocation[key] instanceof Object) {
          this.recurse(invocation[key]);
        }
        if (key === 'target' && invocation[key].type === 'Invocation') {
          const innerValue = invocation.target.value;
          expect(innerValue.target.type).toBeDefined();
          expect(innerValue.target.value).toBeDefined();
        }
      }
    }
  }

  async timeout(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
