const { DetoxRuntimeError } = require('../errors');
const { assertTraceDescription } = require('../utils/assertArgument');
const { systemActionDescription, expectDescription } = require('../utils/invocationTraceDescriptions');
const log = require('../utils/logger').child({ cat: 'ws-client, ws' });
const traceInvocationCall = require('../utils/traceInvocationCall').bind(null, log);


class SystemExpect {
  constructor(xcuitestRunner, element) {
    this._xcuitestRunner = xcuitestRunner;
    this.element = element;
    this.modifiers = [];
  }

  toExist() {
    const traceDescription = expectDescription.toExist();
    return this.expect('toExist', traceDescription);
  }

  get not() {
    this.modifiers.push('not');
    return this;
  }

  createInvocation(systemExpectation) {
    return {
      type: 'systemExpectation',
      systemPredicate: this.element.matcher.predicate,
      ...(this.element.index !== undefined && { systemAtIndex: this.element.index }),
      ...(this.modifiers.length !== 0 && { systemModifiers: this.modifiers }),
      systemExpectation
    };
  }

  expect(expectation, traceDescription) {
    assertTraceDescription(traceDescription);

    const invocation = this.createInvocation(expectation);
    traceDescription = expectDescription.full(traceDescription, this.modifiers.includes('not'));
    return _executeInvocation(this._xcuitestRunner, invocation, traceDescription);
  }
}

class SystemElement {
  constructor(xcuitestRunner, matcher, index) {
    this._xcuitestRunner = xcuitestRunner;
    this.matcher = matcher;
    this.index = index;
  }

  atIndex(index) {
    if (typeof index !== 'number' || index < 0) throw new DetoxRuntimeError(`index should be an integer, got ${index} (${typeof index})`);
    this.index = index;
    return this;
  }

  tap() {
    const traceDescription = systemActionDescription.tap();
    return this.withAction('tap', traceDescription);
  }

  withAction(action, traceDescription) {
    assertTraceDescription(traceDescription);

    const invocation = {
      type: 'systemAction',
      systemPredicate: this.matcher.predicate,
      ...(this.index !== undefined && { systemAtIndex: this.index }),
      systemAction: action
    };
    traceDescription = systemActionDescription.full(traceDescription);
    return _executeInvocation(this._xcuitestRunner, invocation, traceDescription);
  }
}

class SystemElementMatcher {
  label(label) {
    if (typeof label !== 'string') throw new DetoxRuntimeError('label should be a string, but got ' + (label + (' (' + typeof label + ')')));
    this.predicate = { type: 'label', value: label.toString() };
    return this;
  }

  type(type) {
    if (typeof type !== 'string') throw new DetoxRuntimeError('type should be a string, but got ' + (type + (' (' + typeof type + ')')));
    this.predicate = { type: 'type', value: type.toString() };
    return this;
  }
}

function systemMatcher() {
  return new SystemElementMatcher();
}

function systemElement(xcuitestRunner, matcher) {
  if (!(matcher instanceof SystemElementMatcher)) {
    throwSystemMatcherError(matcher);
  }

  return new SystemElement(xcuitestRunner, matcher);
}

function throwSystemMatcherError(param) {
  const paramDescription = JSON.stringify(param);
  throw new DetoxRuntimeError(`${paramDescription} is not a Detox system matcher. More about system matchers here: https://wix.github.io/Detox/docs/api/system`);
}

function systemExpect(xcuitestRunner, element) {
  return new SystemExpect(xcuitestRunner, element);
}

function _executeInvocation(xcuitestRunner, invocation, traceDescription) {
  return traceInvocationCall(traceDescription, invocation, xcuitestRunner.execute(invocation));
}

function isSystemElement(element) {
  return element instanceof SystemElement;
}

module.exports = {
  systemMatcher,
  systemElement,
  systemExpect,
  isSystemElement
};
