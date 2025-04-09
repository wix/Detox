const DetoxRuntimeError = require('../../errors/DetoxRuntimeError');
const invoke = require('../../invoke');
const assertIsFunction = require('../../utils/assertIsFunction');
const isArrowFunction = require('../../utils/isArrowFunction');
const actions = require('../actions/web');
const EspressoWebDetoxApi = require('../espressoapi/web/EspressoWebDetox');
const WebViewElementApi = require('../espressoapi/web/WebViewElement');
const { ActionInteraction } = require('../interactions/web');

const { WebMatcher } = require('./WebMatcher');

const _device = Symbol('device');
const _emitter = Symbol('emitter');
const _matcher = Symbol('matcher');
const _invocationManager = Symbol('invocationManager');
const _webMatcher = Symbol('webMatcher');
const _webViewElement = Symbol('webViewElement');

class WebElement {
  constructor({ device, invocationManager, webMatcher, webViewElement }) {
    this[_device] = device;
    this[_invocationManager] = invocationManager;
    this[_webMatcher] = webMatcher;
    this[_webViewElement] = webViewElement;

    this.atIndex(0);
  }

  asSecured() {
    throw new DetoxRuntimeError('asSecured() is not supported for Android WebElement');
  }

  atIndex(index) {
    const webViewElementCall = this[_webViewElement]._call;
    const webMatcherCall = this[_webMatcher]._call;

    this._call = invoke.callDirectly(WebViewElementApi.element(webViewElementCall, webMatcherCall.value, index));
    return this;
  }

  async executeAction(action) {
    const result = await new ActionInteraction(this[_invocationManager], action).execute();
    // Workaround since Detox doesn't wait for the action to complete.
    await new Promise(resolve => setTimeout(resolve, 500));
    return result;
  }

  async tap() {
    return await this.executeAction(new actions.WebTapAction(this));
  }

  async typeText(text, isContentEditable = false) {
    if (isContentEditable) {
      return await this[_device]._typeText(text);
    }
    return await this.executeAction(new actions.WebTypeTextAction(this, text));
  }

  // At the moment not working on content-editable
  async replaceText(text) {
    return await this.executeAction(new actions.WebReplaceTextAction(this, text));
  }

  // At the moment not working on content-editable
  async clearText() {
    return await this.executeAction(new actions.WebClearTextAction(this));
  }

  async scrollToView() {
    return await this.executeAction(new actions.WebScrollToViewAction(this));
  }

  async getText() {
    return await this.executeAction(new actions.WebGetTextAction(this));
  }

  async focus() {
    return await this.executeAction(new actions.WebFocusAction(this));
  }

  async selectAllText() {
    return await this.executeAction(new actions.WebSelectAllText(this));
  }

  async moveCursorToEnd() {
    return await this.executeAction(new actions.WebMoveCursorEnd(this));
  }

  async runScript(maybeFunction, args) {
    const script = stringifyScript(maybeFunction);

    if (args) {
      return await this.executeAction(new actions.WebRunScriptWithArgsAction(this, script, args));
    } else {
      return await this.executeAction(new actions.WebRunScriptAction(this, script));
    }
  }

  async getCurrentUrl() {
    return await this.executeAction(new actions.WebGetCurrentUrlAction(this));
  }

  async getTitle() {
    return await this.executeAction(new actions.WebGetTitleAction(this));
  }
}

class WebViewElement {
  constructor({ device, emitter, invocationManager, matcher }) {
    this[_device] = device;
    this[_emitter] = emitter;
    this[_invocationManager] = invocationManager;
    this[_matcher] = matcher;

    if (matcher !== undefined) {
      this._call = invoke.callDirectly(EspressoWebDetoxApi.getWebView(matcher._call.value));
    } else {
      this._call = invoke.callDirectly(EspressoWebDetoxApi.getWebView());
  }

    this.element = this.element.bind(this);
  }

  element(webMatcher) {
    if (webMatcher instanceof WebMatcher) {
      return new WebElement({
        device: this[_device],
        invocationManager: this[_invocationManager],
        webViewElement: this,
        webMatcher,
      });
    }

    throw new DetoxRuntimeError(`element() argument is invalid, expected a web matcher, but got ${typeof webMatcher}`);
  }

  atIndex(_index) {
    // Not implemented yet
    throw new DetoxRuntimeError('atIndex() is not supported for Android WebViewElement');
  }
}

function stringifyScript(maybeFunction) {
  if (typeof maybeFunction !== 'string' && typeof maybeFunction !== 'function') {
    return maybeFunction;
  }

  const script = (typeof maybeFunction === 'function' ? maybeFunction.toString() : assertIsFunction(maybeFunction)).trim();
  // WebElement interactions don't support arrow functions for some reason.
  if (isArrowFunction(script)) {
    return `function arrowWorkaround() { return (${script}).apply(this, arguments); }`;
  }

  return script;
}

module.exports = {
  WebElement,
  WebViewElement,
};
