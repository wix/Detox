const assert = require('assert');

const _ = require('lodash');

const { webViewActionDescription, expectDescription } = require('../utils/invocationTraceDescriptions');
const log = require('../utils/logger').child({ cat: 'ws-client, ws' });
const traceInvocationCall = require('../utils/traceInvocationCall').bind(null, log);


class WebExpect {
  constructor(invocationManager, element) {
    this._invocationManager = invocationManager;
    this.element = element;
    this.modifiers = [];
  }

  toHaveText(text) {
    const traceDescription = expectDescription.toHaveText(text);
    return this.expect('toHaveText', traceDescription, text);
  }

  toExist() {
    const traceDescription = expectDescription.toExist();
    return this.expect('toExist', traceDescription);
  }

  get not() {
    this.modifiers.push('not');
    return this;
  }

  createInvocation(expectation, ...params) {
    const definedParams = _.without(params, undefined);
    return {
      type: 'webExpectation',
      ...(this.element.webViewElement !== undefined) && {
        predicate: this.element.webViewElement.matcher.predicate,
        ...(this.element.webViewElement.index !== undefined && { atIndex: this.element.webViewElement.index }),
      },
      webPredicate: this.element.matcher.predicate,
      ...(this.element.index !== undefined && { webAtIndex: this.element.index }),
      ...(this.modifiers.length !== 0 && { webModifiers: this.modifiers }),
      expectation,
      ...(definedParams.length !== 0 && { params: definedParams })
    };
  }

  expect(expectation, traceDescription, ...params) {
    assert(traceDescription, `must provide trace description for expectation: \n ${JSON.stringify(expectation)}`);

    const invocation = this.createInvocation(expectation, ...params);
    traceDescription = expectDescription.full(traceDescription, this.modifiers.includes('not'));
    return _executeInvocation(this._invocationManager, invocation, traceDescription);
  }
}

class WebElement {
  constructor(invocationManager, emitter, webViewElement, matcher, index) {
    this._invocationManager = invocationManager;
    this._emitter = emitter;
    this.webViewElement = webViewElement;
    this.matcher = matcher;
    this.index = index;
  }

  atIndex(index) {
    if (typeof index !== 'number') throw new Error(`atIndex argument must be a number, got ${typeof index}`);
    this.index = index;
    return this;
  }

  tap() {
    const traceDescription = webViewActionDescription.tap();
    return this.withAction('tap', traceDescription);
  }

  typeText(text, isContentEditable = false) {
    const traceDescription = webViewActionDescription.typeText(text, isContentEditable);
    return this.withAction('typeText', traceDescription, text, isContentEditable);
  }

  replaceText(text) {
    const traceDescription = webViewActionDescription.replaceText(text);
    return this.withAction('replaceText', traceDescription, text);
  }

  clearText() {
    const traceDescription = webViewActionDescription.clearText();
    return this.withAction('clearText', traceDescription);
  }

  selectAllText() {
    const traceDescription = webViewActionDescription.selectAllText();
    return this.withAction('selectAllText', traceDescription);
  }

  getText() {
    const traceDescription = webViewActionDescription.getText();
    return this.withAction('getText', traceDescription);
  }

  scrollToView() {
    const traceDescription = webViewActionDescription.scrollToView();
    return this.withAction('scrollToView', traceDescription);
  }

  focus() {
    const traceDescription = webViewActionDescription.focus();
    return this.withAction('focus', traceDescription);
  }

  moveCursorToEnd() {
    const traceDescription = webViewActionDescription.moveCursorToEnd();
    return this.withAction('moveCursorToEnd', traceDescription);
  }

  runScript(script) {
    const traceDescription = webViewActionDescription.runScript(script);
    return this.withAction('runScript', traceDescription, script);
  }

  runScriptWithArgs(script, ...args) {
    const traceDescription = webViewActionDescription.runScriptWithArgs(script, ...args);
    return this.withAction('runScriptWithArgs', traceDescription, script, ...args);
  }

  getCurrentUrl() {
    const traceDescription = webViewActionDescription.getCurrentUrl();
    return this.withAction('getCurrentUrl', traceDescription);
  }

  getTitle() {
    const traceDescription = webViewActionDescription.getTitle();
    return this.withAction('getTitle', traceDescription);
  }

  withAction(action, traceDescription, ...params) {
    assert(traceDescription, `must provide trace description for action: \n ${JSON.stringify(action)}`);

    const invocation = {
      type: 'webAction',
      ...(this.webViewElement !== undefined) && {
        predicate: this.webViewElement.matcher.predicate,
        ...(this.webViewElement.index !== undefined && { atIndex: this.webViewElement.index }),
      },
      webPredicate: this.matcher.predicate,
      ...(this.index !== undefined && { webAtIndex: this.index }),
      action,
      ...(params.length !== 0 && { params }),
    };
    traceDescription = webViewActionDescription.full(traceDescription);
    return _executeInvocation(this._invocationManager, invocation, traceDescription);
  }
}

class WebElementMatcher {
  id(id) {
    if (typeof id !== 'string') throw new Error('id should be a string, but got ' + (id + (' (' + (typeof id + ')'))));
    this.predicate = { type: 'id', value: id.toString() };
    return this;
  }

  className(className) {
    if (typeof className !== 'string') throw new Error('className should be a string, but got ' + (className + (' (' + (typeof className + ')'))));
    this.predicate = { type: 'class', value: className.toString() };
    return this;
  }

  cssSelector(cssSelector) {
    if (typeof cssSelector !== 'string') throw new Error('cssSelector should be a string, but got ' + (cssSelector + (' (' + (typeof cssSelector + ')'))));
    this.predicate = { type: 'css', value: cssSelector.toString() };
    return this;
  }

  name(name) {
    if (typeof name !== 'string') throw new Error('name should be a string, but got ' + (name + (' (' + (typeof name + ')'))));
    this.predicate = { type: 'name', value: name.toString() };
    return this;
  }

  xpath(xpath) {
    if (typeof xpath !== 'string') throw new Error('xpath should be a string, but got ' + (xpath + (' (' + (typeof xpath + ')'))));
    this.predicate = { type: 'xpath', value: xpath.toString() };
    return this;
  }

  href(href) {
    if (typeof href !== 'string') throw new Error('href should be a string, but got ' + (href + (' (' + (typeof href + ')'))));
    this.predicate = { type: 'href', value: href.toString() };
    return this;
  }

  hrefContains(href) {
    if (typeof href !== 'string') throw new Error('href should be a string, but got ' + (href + (' (' + (typeof href + ')'))));
    this.predicate = { type: 'hrefContains', value: href.toString() };
    return this;
  }

  tag(tag) {
    if (typeof tag !== 'string') throw new Error('tag should be a string, but got ' + (tag + (' (' + (typeof tag + ')'))));
    this.predicate = { type: 'tag', value: tag.toString() };
    return this;
  }
}

function webMatcher() {
  return new WebElementMatcher();
}

function webElement(invocationManager, emitter, webViewElement, matcher) {
  if (!(matcher instanceof WebElementMatcher)) {
    throwWebViewMatcherError(matcher);
  }

  return new WebElement(invocationManager, emitter, webViewElement, matcher);
}

function throwWebViewMatcherError(param) {
  const paramDescription = JSON.stringify(param);
  throw new Error(`${paramDescription} is not a Detox web-view matcher. More about web-view matchers here: https://wix.github.io/Detox/docs/api/webviews`);
}

function webExpect(invocationManager, element) {
  if (!(element instanceof WebElement)) {
    throwWebElementError(element);
  }

  return new WebExpect(invocationManager, element);
}

function throwWebElementError(param) {
  const paramDescription = JSON.stringify(param);
  throw new Error(`${paramDescription} is not a web element. More about web elements here: https://wix.github.io/Detox/docs/api/webviews`);
}

function _executeInvocation(invocationManager, invocation, traceDescription) {
  return traceInvocationCall(traceDescription, invocation, invocationManager.execute(invocation));
}

function isWebElement(element) {
  return element instanceof WebElement;
}

module.exports = {
  webMatcher,
  webElement,
  webExpect,
  isWebElement
};
