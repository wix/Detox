const DetoxRuntimeError = require('../errors/DetoxRuntimeError');

const { NativeElement } = require('./core/NativeElement');
const { NativeExpectElement } = require('./core/NativeExpect');
const { NativeMatcher } = require('./core/NativeMatcher');
const { NativeWaitForElement } = require('./core/NativeWaitFor');
const { WebElement, WebViewElement } = require('./core/WebElement');
const { WebExpectElement } = require('./core/WebExpect');
const matchers = require('./matchers');

class AndroidExpect {
  constructor({ apps, device, emitter }) {
    this._device = device;
    this._emitter = emitter;
    this._apps = apps;
    this._currAppAlias = null;

    this.by = matchers;
    this.element = this.element.bind(this);
    this.expect = this.expect.bind(this);
    this.waitFor = this.waitFor.bind(this);
    this.web = this.web.bind(this);
    this.web.element = (...args) => this.web().element(...args);
    this.selectApp = this.selectApp.bind(this);
  }

  async selectApp(appAlias) {
    this._currAppAlias = appAlias;
    await this._device.selectApp(appAlias); // Revisit: This is definitely NOT the right approach. We must be able to perform this across the board through the device.selectApp() API, and not the other way around.
  }

  element(matcher) {
    if (matcher instanceof NativeMatcher) {
      return new NativeElement(this._currentApp().invocationManager, this._emitter, matcher);
    }

    throw new DetoxRuntimeError(`element() argument is invalid, expected a native matcher, but got ${typeof element}`);
  }

  // Matcher can be null only if there is only one webview on the hierarchy tree.
  web(matcher) {
    if (matcher == null || matcher instanceof NativeMatcher) {
      return new WebViewElement({
        device: this._device,
        emitter: this._emitter,
        invocationManager: this._currentApp()._invocationManager,
        matcher,
      });
    }

    throw new DetoxRuntimeError(`web() argument is invalid, expected a native matcher, but got ${typeof element}`);
  }

  expect(element) {
    if (element instanceof WebElement) return new WebExpectElement(this._currentApp().invocationManager, element);
    if (element instanceof NativeElement) return new NativeExpectElement(this._currentApp().invocationManager, element);
    throw new DetoxRuntimeError(`expect() argument is invalid, expected a native or web matcher, but got ${typeof element}`);
  }

  waitFor(element) {
    if (element instanceof NativeElement) return new NativeWaitForElement(this._currentApp().invocationManager, element);
    throw new DetoxRuntimeError(`waitFor() argument is invalid, got ${typeof element}`);
  }

  _currentApp() {
    return this._apps[this._currAppAlias];
  }
}

module.exports = AndroidExpect;
