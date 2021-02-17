const invoke = require('../../invoke');
const EspressoWebDetoxApi = require('../espressoapi/web/EspressoWebDetox');
const WebViewElementApi = require('../espressoapi/web/WebViewElement');
const { ActionInteraction } = require('../interactions/web');
const actions = require('../actions/web');
const { WebMatcher } = require('./WebMatcher');

class WebElement {
  constructor(invocationManager, deviceDriver, webViewElement, matcher, index) {
    this._invocationManager = invocationManager;
    this._deviceDriver = deviceDriver;
    this._call = invoke.callDirectly(WebViewElementApi.element(webViewElement._call, matcher._call.value, index));
  }

  // At the moment not working on content-editable
  async tap() {
    return await new ActionInteraction(this._invocationManager, new actions.WebTapAction(this)).execute();
  }

  async typeText(text, isContentEditable = false) {
    if (isContentEditable) {
      return await this._deviceDriver.typeText(text);
    }
    return await new ActionInteraction(this._invocationManager,  new actions.WebTypeTextAction(this, text)).execute();
  }

  // At the moment not working on content-editable
  async replaceText(text) {
    return await new ActionInteraction(this._invocationManager,  new actions.WebReplaceTextAction(this, text)).execute();
  }

  // At the moment not working on content-editable
  async clearText() {
    return await new ActionInteraction(this._invocationManager,  new actions.WebClearTextAction(this)).execute();
  }

  async scrollToView() {
    return await new ActionInteraction(this._invocationManager,  new actions.WebScrollToViewAction(this)).execute();
  }

  async getText() {
    return await new ActionInteraction(this._invocationManager,  new actions.WebGetTextAction(this)).execute();
  }

  async focus() {
    return await new ActionInteraction(this._invocationManager, new actions.WebFocusAction(this)).execute();
  }

  async selectAllText() {
    return await new ActionInteraction(this._invocationManager, new actions.WebSelectAllText(this)).execute();
  }

  async moveCursorToEnd() {
    return await new ActionInteraction(this._invocationManager, new actions.WebMoveCursorEnd(this)).execute();
  }

  async runScript(script) {
    return await new ActionInteraction(this._invocationManager, new actions.WebRunScriptAction(this, script)).execute();
  }

  async runScriptWithArgs(script, args) {
    return await new ActionInteraction(this._invocationManager, new actions.WebRunScriptWithArgsAction(this, script, args)).execute();
  }

  async getCurrentUrl() {
    return await new ActionInteraction(this._invocationManager, new actions.WebGetCurrentUrlAction(this)).execute();
  }

  async getTitle() {
    return await new ActionInteraction(this._invocationManager, new actions.WebGetTitleAction(this)).execute();
  }
}

class WebViewElement {
  constructor(invocationManager, deviceDriver, emitter, matcher) {
    this._invocationManager = invocationManager;
    this._deviceDriver = deviceDriver;
    this._emitter = emitter;
    this._matcher = matcher;

    if (matcher !== undefined) {
      this._call = invoke.callDirectly(EspressoWebDetoxApi.getWebView(matcher._call.value));
    } else {
      this._call = invoke.callDirectly(EspressoWebDetoxApi.getWebView());
    }

    this.element = this.element.bind(this);
  }

  element(webMatcher, index = 0) {
    if (webMatcher instanceof WebMatcher) {
      return new WebElement(this._invocationManager, this._deviceDriver, this, webMatcher, index);
    }

    throw new Error(`element() argument is invalid, expected a web matcher, but got ${typeof element}`);
  }
}

module.exports = {
  WebElement,
  WebViewElement,
};
