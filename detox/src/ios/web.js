const _ = require('lodash');

const { DetoxRuntimeError } = require('../errors');
const { assertTraceDescription } = require('../utils/assertArgument');
const { webViewActionDescription, expectDescription } = require('../utils/invocationTraceDescriptions');
const log = require('../utils/logger').child({ cat: 'ws-client, ws' });
const traceInvocationCall = require('../utils/traceInvocationCall').bind(null, log);


class WebExpect {
  constructor(invocationManager, xcuitestRunner, element) {
    this._invocationManager = invocationManager;
    this._xcuitestRunner = xcuitestRunner;
    this.element = element;
    this.modifiers = [];
  }

  toHaveText(text) {
    if (typeof text !== 'string') throw new DetoxRuntimeError('text should be a string, but got ' + (text + (' (' + (typeof text + ')'))));

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

  createInvocation(webExpectation, ...params) {
    const definedParams = _.without(params, undefined);
    return {
      type: 'webExpectation',
      ...(this.element.webViewElement !== undefined) && {
        predicate: this.element.webViewElement.matcher.predicate,
        ...(this.element.webViewElement.matcher.index !== undefined && { atIndex: this.element.webViewElement.matcher.index }),
      },
      webPredicate: this.element.matcher.predicate,
      ...(this.element.index !== undefined && { webAtIndex: this.element.index }),
      ...(this.modifiers.length !== 0 && { webModifiers: this.modifiers }),
      webExpectation,
      ...(definedParams.length !== 0 && { params: definedParams })
    };
  }

  expect(expectation, traceDescription, ...params) {
    assertTraceDescription(traceDescription);

    const invocation = this.createInvocation(expectation, ...params);
    traceDescription = expectDescription.full(traceDescription, this.modifiers.includes('not'));

    const invocationRunner = this.element.isSecured ? this._xcuitestRunner : this._invocationManager;
    return _executeInvocation(invocationRunner, invocation, traceDescription);
  }
}

class WebElement {
  constructor(invocationManager, xcuitestRunner, emitter, webViewElement, matcher, index) {
    this._invocationManager = invocationManager;
    this._xcuitestRunner = xcuitestRunner;
    this._emitter = emitter;
    this.webViewElement = webViewElement;
    this.matcher = matcher;
    this.index = index;
    this.isSecured = false;
  }

  asSecured() {
    const supportedMatcherTypes = ['label', 'type'];
    const matcherType = this.matcher.predicate.type;

    if (!supportedMatcherTypes.includes(matcherType)) {
      throw new DetoxRuntimeError(`Only matchers of type ${supportedMatcherTypes.join(', ')} can be secured, got ${matcherType}`);
    }

    this.isSecured = true;
    return this;
  }

  atIndex(index) {
    if (typeof index !== 'number' || index < 0) throw new DetoxRuntimeError(`index should be an integer, got ${index} (${typeof index})`);
    this.index = index;
    return this;
  }

  tap() {
    const traceDescription = webViewActionDescription.tap();
    return this.withAction('tap', traceDescription);
  }

  typeText(text, isContentEditable = false) {
    const traceDescription = webViewActionDescription.typeText(text, isContentEditable);
    return this.withAction('typeText', traceDescription, text);
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

  async getText() {
    const traceDescription = webViewActionDescription.getText();
    let result = await this.withAction('getText', traceDescription);
    return this.extractResult(result, { type: 'text' });
  }

  extractResult(result, options) {
    // iOS returns the result under `result` key, while Android returns it under the action `type` key.
    if (result['error']) {
      throw new DetoxRuntimeError(`Error thrown in web action: ${result['error']}`);
    } else if (options.type && result[options.type]) {
      return result[options.type];
    } else if (result['result']) {
      return result['result'];
    } else if (options.allowUndefined && Object.keys(result).length === 0) {
      return undefined;
    } else {
      log.warn(`Failed to extract ${options.type ?? 'result'} from result: ${JSON.stringify(result)}`);
      return result;
    }
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

  async runScript(script, args) {
    if (args !== undefined && args.length !== 0) {
      return await this.runScriptWithArgs(script, args);
    }

    if (typeof script === 'function') {
      script = script.toString();
    }

    const traceDescription = webViewActionDescription.runScript(script);
    const result = await this.withAction('runScript', traceDescription, script);
    return this.extractResult(result, { allowUndefined: true });
  }

  async runScriptWithArgs(script, args) {
    if (typeof script === 'function') {
      script = script.toString();
    }

    const traceDescription = webViewActionDescription.runScriptWithArgs(script, args);
    const result = await this.withAction('runScriptWithArgs', traceDescription, script, args);
    return this.extractResult(result, { allowUndefined: true });
  }

  async getCurrentUrl() {
    const traceDescription = webViewActionDescription.getCurrentUrl();
    let result = await this.withAction('getCurrentUrl', traceDescription);
    return this.extractResult(result, { type: 'url' });
  }

  async getTitle() {
    const traceDescription = webViewActionDescription.getTitle();
    let result = await this.withAction('getTitle', traceDescription);
    return this.extractResult(result, { type: 'title' });
  }

  withAction(action, traceDescription, ...params) {
    assertTraceDescription(traceDescription);

    const invocation = {
      type: 'webAction',
      ...(this.webViewElement !== undefined) && {
        predicate: this.webViewElement.matcher.predicate,
        ...(this.webViewElement.matcher.index !== undefined && { atIndex: this.webViewElement.matcher.index }),
      },
      webPredicate: this.matcher.predicate,
      ...(this.index !== undefined && { webAtIndex: this.index }),
      webAction: action,
      ...(params.length !== 0 && { params }),
    };
    traceDescription = webViewActionDescription.full(traceDescription);

    const invocationRunner = this.isSecured ? this._xcuitestRunner : this._invocationManager;
    return _executeInvocation(invocationRunner, invocation, traceDescription);
  }
}

class WebElementMatcher {
  id(id) {
    if (typeof id !== 'string') throw new DetoxRuntimeError('id should be a string, but got ' + (id + (' (' + (typeof id + ')'))));
    this.predicate = { type: 'id', value: id.toString() };
    return this;
  }

  className(className) {
    if (typeof className !== 'string') throw new DetoxRuntimeError('className should be a string, but got ' + (className + (' (' + (typeof className + ')'))));
    this.predicate = { type: 'class', value: className.toString() };
    return this;
  }

  cssSelector(cssSelector) {
    if (typeof cssSelector !== 'string') throw new DetoxRuntimeError('cssSelector should be a string, but got ' + (cssSelector + (' (' + (typeof cssSelector + ')'))));
    this.predicate = { type: 'css', value: cssSelector.toString() };
    return this;
  }

  name(name) {
    if (typeof name !== 'string') throw new DetoxRuntimeError('name should be a string, but got ' + (name + (' (' + (typeof name + ')'))));
    this.predicate = { type: 'name', value: name.toString() };
    return this;
  }

  xpath(xpath) {
    if (typeof xpath !== 'string') throw new DetoxRuntimeError('xpath should be a string, but got ' + (xpath + (' (' + (typeof xpath + ')'))));
    this.predicate = { type: 'xpath', value: xpath.toString() };
    return this;
  }

  href(href) {
    if (typeof href !== 'string') throw new DetoxRuntimeError('href should be a string, but got ' + (href + (' (' + (typeof href + ')'))));
    this.predicate = { type: 'href', value: href.toString() };
    return this;
  }

  hrefContains(href) {
    if (typeof href !== 'string') throw new DetoxRuntimeError('href should be a string, but got ' + (href + (' (' + (typeof href + ')'))));
    this.predicate = { type: 'hrefContains', value: href.toString() };
    return this;
  }

  tag(tag) {
    if (typeof tag !== 'string') throw new DetoxRuntimeError('tag should be a string, but got ' + (tag + (' (' + (typeof tag + ')'))));
    this.predicate = { type: 'tag', value: tag.toString() };
    return this;
  }

  label(label) {
    if (typeof label !== 'string') throw new DetoxRuntimeError('label should be a string, but got ' + (label + (' (' + (typeof label + ')'))));
    this.predicate = { type: 'label', value: label.toString() };
    return this;
  }

  value(value) {
    if (typeof value !== 'string') throw new DetoxRuntimeError('value should be a string, but got ' + (value + (' (' + (typeof value + ')'))));
    this.predicate = { type: 'value', value: value.toString() };
    return this;
  }

  type(type) {
    if (typeof type !== 'string') throw new DetoxRuntimeError('type should be a string, but got ' + (type + (' (' + (typeof type + ')'))));
    this.predicate = { type: 'type', value: type.toString() };
    return this;
  }
}

function webMatcher() {
  return new WebElementMatcher();
}

function webElement(invocationManager, xcuitestRunner, emitter, webViewElement, matcher) {
  if (!(matcher instanceof WebElementMatcher)) {
    throwWebViewMatcherError(matcher);
  }

  return new WebElement(invocationManager, xcuitestRunner, emitter, webViewElement, matcher);
}

function throwWebViewMatcherError(param) {
  const paramDescription = JSON.stringify(param);
  throw new DetoxRuntimeError(`${paramDescription} is not a Detox web-view matcher. More about web-view matchers here: https://wix.github.io/Detox/docs/api/webviews`);
}

function webExpect(invocationManager, xcuitestRunner, element) {
  return new WebExpect(invocationManager, xcuitestRunner, element);
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
