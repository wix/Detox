const DetoxRuntimeError = require('../errors/DetoxRuntimeError');

const { NativeElement } = require('./core/NativeElement');
const { NativeExpectElement } = require('./core/NativeExpect');
const { NativeMatcher } = require('./core/NativeMatcher');
const { NativeWaitForElement } = require('./core/NativeWaitFor');
const { WebElement, WebViewElement } = require('./core/WebElement');
const { WebExpectElement } = require('./core/WebExpect');
const matchers = require('./matchers');

class AndroidExpect {
  constructor({ invocationManager, device, emitter }) {
    this._device = device;
    this._emitter = emitter;
    this._invocationManager = invocationManager;

    this.by = matchers;
    this.element = this.element.bind(this);
    this.expect = this.expect.bind(this);
    this.waitFor = this.waitFor.bind(this);
    this.web = this.web.bind(this);
    this.web.element = (...args) => this.web().element(...args);
  }

  element(matcher) {
    if (matcher instanceof NativeMatcher) {
      return new NativeElement(this._invocationManager, this._emitter, matcher);
    }

    throw new DetoxRuntimeError(`element() argument is invalid, expected a native matcher, but got ${typeof element}`);
  }

  // Matcher can be null only if there is only one webview on the hierarchy tree.
  web(matcher) {
    if (matcher == null || matcher instanceof NativeMatcher) {
      return new WebViewElement({
        device: this._device,
        emitter: this._emitter,
        invocationManager: this._invocationManager,
        matcher,
      });
    }

    throw new DetoxRuntimeError(`web() argument is invalid, expected a native matcher, but got ${typeof element}`);
  }

  expect(element) {
    if (element instanceof WebElement) return new WebExpectElement(this._invocationManager, element);
    if (element instanceof NativeElement) return new NativeExpectElement(this._invocationManager, element);
    throw new DetoxRuntimeError(`expect() argument is invalid, expected a native or web matcher, but got ${typeof element}`);
  }

  waitFor(element) {
    if (element instanceof NativeElement) return new NativeWaitForElement(this._invocationManager, element);
    throw new DetoxRuntimeError(`waitFor() argument is invalid, got ${typeof element}`);
  }
}

module.exports = AndroidExpect;
