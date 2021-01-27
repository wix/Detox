const invoke = require('../invoke');
const EspressoWebDetoxApi = require('./espressoapi/web/EspressoWebDetox');
const WebViewElementApi = require('./espressoapi/web/WebViewElement');
const WebElementApi = require('./espressoapi/web/WebElement');
const WebExpectApi = require('./espressoapi/web/WebExpect');
const {
  IdMatcher,
  ClassNameMatcher,
  CssSelectorMatcher,
  NameMatcher,
  XPathMatcher,
  LinkTextMatcher,
  PartialLinkTextMatcher,
  TagNameMatcher,
} = require('./webMatcher');
const {
  selectElementContents,
  moveCursorToEnd,
  focus
 } = require ('./espressoapi/web/simpleAtoms');

class WebInteraction {
  constructor(invocationManager) {
    this._call = undefined;
    this._invocationManager = invocationManager;
  }

  async execute() {
    const resultObj = await this._invocationManager.execute(this._call);
    return resultObj ? resultObj.result : undefined;
  }
}

class ActionInteraction extends WebInteraction {
  constructor(invocationManager, action) {
    super(invocationManager);
    this._call = action._call;
  }
}

class WebAction {

}

class WebTapAction extends WebAction {
  constructor(element) {
    super();
    this._call = WebElementApi.tap(element._call);
  }
}

class WebTypeTextAction extends WebAction {
  constructor(element, text) {
    super();
    this._call = WebElementApi.typeText(element._call, text);
  }
}

class WebReplaceTextAction extends WebAction {
  constructor(element, text) {
    super();
    this._call = WebElementApi.replaceText(element._call, text);
  }
}

class WebClearTextAction extends WebAction {
  constructor(element) {
    super();
    this._call = WebElementApi.clearText(element._call);
  }
}

class WebScrollToViewAction extends WebAction {
  constructor(element) {
    super();
    this._call = WebElementApi.scrollToView(element._call);
  }
}

class WebGetTextAction extends WebAction {
  constructor(element) {
    super();
    this._call = WebElementApi.getText(element._call);
  }
}

class WebRunScriptAction extends WebAction {
  constructor(element, script) {
    super();
    this._call = WebElementApi.runScript(element._call, script);
  }
}

class WebRunScriptWithArgsAction extends WebAction {
  constructor(element, script, args) {
    super();
    this._call = WebElementApi.runScriptWithArgs(element._call, script, args);
  }
}

class WebGetCurrentUrlAction extends WebAction {
  constructor(element) {
    super();
    this._call = WebElementApi.getCurrentUrl(element._call);
  }
}

class WebGetTitleAction extends WebAction {
  constructor(element) {
    super();
    this._call = WebElementApi.getTitle(element._call);
  }
}

class WebFocusAction extends WebAction {
  constructor(element) {
    super();
    this._call = WebElementApi.runScript(element._call, focus);
  }
}

class WebSelectAllText extends WebAction {
  constructor(element) {
    super();
    this._call = WebElementApi.runScript(element._call, selectElementContents);
  }
}

class WebMoveCursorEnd extends WebAction {
  constructor(element) {
    super();
    this._call = WebElementApi.runScript(element._call, moveCursorToEnd);
  }
}
class WebViewElement {
  constructor(device, invocationManager, emitter, matcher) {
    this._invocationManager = invocationManager;
    this._emitter = emitter;
    this._device = device;
    this._matcher = matcher;
    if (matcher !== undefined) {
      this._call = invoke.callDirectly(EspressoWebDetoxApi.getWebView(matcher._call.value));
    } else {
      this._call = invoke.callDirectly(EspressoWebDetoxApi.getWebView());
    }

    this.element = this.element.bind(this);
  }

  element(webMatcher, index = 0) {
    return new WebElement(this._device, this._invocationManager, this, webMatcher, index);
  }
}

class WebElement {
  constructor(device, invocationManager, webViewElement, matcher, index) {
    this._invocationManager = invocationManager;
    this._call = invoke.callDirectly(WebViewElementApi.element(webViewElement._call, matcher._call.value, index));
    this._device = device;
  }

  // At the moment not working on content-editable
  async tap() {
    return await new ActionInteraction(this._invocationManager, new WebTapAction(this)).execute();
  }

  async typeText(text, isContentEditable = false) {
    if (isContentEditable) {
      return await this._device.typeText(text);
    }
    return await new ActionInteraction(this._invocationManager,  new WebTypeTextAction(this, text)).execute();
  }

  // At the moment not working on content-editable
  async replaceText(text) {
    return await new ActionInteraction(this._invocationManager,  new WebReplaceTextAction(this, text)).execute();
  }

  // At the moment not working on content-editable
  async clearText() {
    return await new ActionInteraction(this._invocationManager,  new WebClearTextAction(this)).execute();
  }

  async scrollToView() {
    return await new ActionInteraction(this._invocationManager,  new WebScrollToViewAction(this)).execute();
  }

  async getText() {
    return await new ActionInteraction(this._invocationManager,  new WebGetTextAction(this)).execute();
  }

  async focus() {
    return await new ActionInteraction(this._invocationManager, new WebFocusAction(this)).execute();
  }

  async selectAllText() {
    return await new ActionInteraction(this._invocationManager, new WebSelectAllText(this)).execute();
  }

  async moveCursorToEnd() {
    return await new ActionInteraction(this._invocationManager, new WebMoveCursorEnd(this)).execute();
  }

  async runScript(script) {
    return await new ActionInteraction(this._invocationManager, new WebRunScriptAction(this, script)).execute();
  }

  async runScriptWithArgs(script, args) {
    return await new ActionInteraction(this._invocationManager, new WebRunScriptWithArgsAction(this, script, args)).execute();
  }

  async getCurrentUrl() {
    return await new ActionInteraction(this._invocationManager, new WebGetCurrentUrlAction(this)).execute();
  }

  async getTitle() {
    return await new ActionInteraction(this._invocationManager, new WebGetTitleAction(this)).execute();
  }
}

class WebAssertionInteraction extends WebInteraction {
  constructor(invocationManager, assertion) {
    super(invocationManager);
    this._call = assertion._call;
  }
}

class WebExistsAssertion extends WebAction {
  constructor(webExpect) {
    super();
    if (webExpect._notCondition) {
      this._call = WebExpectApi.toNotExist(webExpect._call);
    } else {
      this._call = WebExpectApi.toExist(webExpect._call);
    }
  }
}

class WebHasTextAssertion extends WebAction {
  constructor(webExpect, text) {
    super();
    if (webExpect._notCondition) {
      this._call = WebExpectApi.toNotHaveText(webExpect._call, text);
    } else {
      this._call = WebExpectApi.toHaveText(webExpect._call, text);
    }
  }
}

class WebExpect {
  constructor(invocationManager) {
    this._invocationManager = invocationManager
    this._notCondition = false;
  }

  get not() {
    this._notCondition = true;
    return this;
  }
}

class WebExpectElement extends WebExpect {
  constructor(invocationManager, webElement) {
    super(invocationManager)
    this._call = invoke.callDirectly(EspressoWebDetoxApi.expect(webElement._call.value));
  }

  async toHaveText(text) {
    return await new WebAssertionInteraction(this._invocationManager, new WebHasTextAssertion(this, text)).execute();
  }

  async toExist() {
    return await new WebAssertionInteraction(this._invocationManager, new WebExistsAssertion(this)).execute();
  }
}
class AndroidWebExpect {
  constructor(device, { invocationManager, emitter }) {
    this._invocationManager = invocationManager;
    this._emitter = emitter;
    this._device = device;

    this.by = {
      id: value => new IdMatcher(value),
      className: value => new ClassNameMatcher(value),
      cssSelector: value => new CssSelectorMatcher(value),
      name: value => new NameMatcher(value),
      xpath: value => new XPathMatcher(value),
      linkText: value => new LinkTextMatcher(value),
      partialLinkText: value => new PartialLinkTextMatcher(value),
      tag: value => new TagNameMatcher(value)
    };

    this.getWebView = this.getWebView.bind(this);
    this.expect = this.expect.bind(this);
  }

  // Matcher can be null only if there is only one webview on the hierarchy tree.
  getWebView(webViewMatcher) {
    return new WebViewElement(this._device, this._invocationManager, this._emitter, webViewMatcher);
  }

  expect(webElement) {
    return new WebExpectElement(this._invocationManager, webElement)
  }
}

module.exports = AndroidWebExpect;
