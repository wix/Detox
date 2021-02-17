const { WebViewElement, WebExpectElement } = require('./core/web');
const matchers = require('./matchers/web');

class AndroidWebExpect {
  constructor({ invocationManager, deviceDriver, emitter }) {
    this._invocationManager = invocationManager;
    this._deviceDriver = deviceDriver;
    this._emitter = emitter;

    this.by = {
      id: (value) => new matchers.IdMatcher(value),
      className: (value) => new matchers.ClassNameMatcher(value),
      cssSelector: (value) => new matchers.CssSelectorMatcher(value),
      name: (value) => new matchers.NameMatcher(value),
      xpath: (value) => new matchers.XPathMatcher(value),
      linkText: (value) => new matchers.LinkTextMatcher(value),
      partialLinkText: (value) => new matchers.PartialLinkTextMatcher(value),
      tag: (value) => new matchers.TagNameMatcher(value)
    };
    this.getWebView = this.getWebView.bind(this);
    this.expect = this.expect.bind(this);
  }

  // Matcher can be null only if there is only one webview on the hierarchy tree.
  getWebView(webViewMatcher) {
    const webview = new WebViewElement(this._invocationManager, this._deviceDriver, this._emitter, webViewMatcher);
    webview.by = this.by;
    webview.expect = this.expect;
    return webview;
  }

  expect(webElement) {
    return new WebExpectElement(this._invocationManager, webElement)
  }
}

module.exports = AndroidWebExpect;
