const DetoxRuntimeError = require('../../errors/DetoxRuntimeError');
const invoke = require('../../invoke');
const actions = require('../actions/web');
const EspressoWebDetoxApi = require('../espressoapi/web/EspressoWebDetox');
const WebViewElementApi = require('../espressoapi/web/WebViewElement');
const { ActionInteraction } = require('../interactions/web');

const { WebMatcher } = require('./WebMatcher');

const _device = Symbol('device');
const _emitter = Symbol('emitter');
const _matcher = Symbol('matcher');
const _webMatcher = Symbol('webMatcher');
const _webViewElement = Symbol('webViewElement');

class WebElement {
  constructor({ device, webMatcher, webViewElement }) {
    this[_device] = device;
    this[_webMatcher] = webMatcher;
    this[_webViewElement] = webViewElement;
    this.atIndex(0);
  }

  atIndex(index) {
    const webViewElementCall = this[_webViewElement]._call;
    const webMatcherCall = this[_webMatcher]._call;

    this._call = invoke.callDirectly(WebViewElementApi.element(webViewElementCall, webMatcherCall.value, index));
    return this;
  }

  // At the moment not working on content-editable
  async tap() {
    return await new ActionInteraction(this[_device], new actions.WebTapAction(this)).execute();
  }

  async typeText(text, isContentEditable = false) {
    if (isContentEditable) {
      return await this[_device].typeText(text);
    }
    return await new ActionInteraction(this[_device], new actions.WebTypeTextAction(this, text)).execute();
  }

  // At the moment not working on content-editable
  async replaceText(text) {
    return await new ActionInteraction(this[_device], new actions.WebReplaceTextAction(this, text)).execute();
  }

  // At the moment not working on content-editable
  async clearText() {
    return await new ActionInteraction(this[_device], new actions.WebClearTextAction(this)).execute();
  }

  async scrollToView() {
    return await new ActionInteraction(this[_device], new actions.WebScrollToViewAction(this)).execute();
  }

  async getText() {
    return await new ActionInteraction(this[_device], new actions.WebGetTextAction(this)).execute();
  }

  async focus() {
    return await new ActionInteraction(this[_device], new actions.WebFocusAction(this)).execute();
  }

  async selectAllText() {
    return await new ActionInteraction(this[_device], new actions.WebSelectAllText(this)).execute();
  }

  async moveCursorToEnd() {
    return await new ActionInteraction(this[_device], new actions.WebMoveCursorEnd(this)).execute();
  }

  async runScript(script) {
    return await new ActionInteraction(this[_device], new actions.WebRunScriptAction(this, script)).execute();
  }

  async runScriptWithArgs(script, args) {
    return await new ActionInteraction(this[_device], new actions.WebRunScriptWithArgsAction(this, script, args)).execute();
  }

  async getCurrentUrl() {
    return await new ActionInteraction(this[_device], new actions.WebGetCurrentUrlAction(this)).execute();
  }

  async getTitle() {
    return await new ActionInteraction(this[_device], new actions.WebGetTitleAction(this)).execute();
  }
}

class WebViewElement {
  constructor({ device, emitter, matcher }) {
    this[_device] = device;
    this[_emitter] = emitter;
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
        webViewElement: this,
        webMatcher,
      });
    }

    throw new DetoxRuntimeError({ message: `element() argument is invalid, expected a web matcher, but got ${typeof element}` });
  }
}

module.exports = {
  WebElement,
  WebViewElement,
};
