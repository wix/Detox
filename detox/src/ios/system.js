const assert = require('assert');

const _ = require('lodash');

const { DetoxRuntimeError } = require('../errors');
const { systemActionDescription, expectDescription } = require('../utils/invocationTraceDescriptions');
const log = require('../utils/logger').child({ cat: 'ws-client, ws' });
const traceInvocationCall = require('../utils/traceInvocationCall').bind(null, log);


class SystemExpect {
  constructor(invocationManager, element) {
    this._invocationManager = invocationManager;
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

  createInvocation(systemExpectation, ...params) {
    const definedParams = _.without(params, undefined);
    return {
      type: 'systemExpectation',
      systemPredicate: this.element.matcher.predicate,
      ...(this.element.index !== undefined && { systemAtIndex: this.element.index }),
      ...(this.modifiers.length !== 0 && { systemModifiers: this.modifiers }),
      systemExpectation,
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

class SystemElement {
  constructor(invocationManager, emitter, matcher, index) {
    this._invocationManager = invocationManager;
    this._emitter = emitter;
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

  withAction(action, traceDescription, ...params) {
    assert(traceDescription, `must provide trace description for action: \n ${JSON.stringify(action)}`);

    const invocation = {
      type: 'systemAction',
      systemPredicate: this.matcher.predicate,
      ...(this.index !== undefined && { systemAtIndex: this.index }),
      systemAction: action,
      ...(params.length !== 0 && { params }),
    };
    traceDescription = systemActionDescription.full(traceDescription);
    return _executeInvocation(this._invocationManager, invocation, traceDescription);
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

function systemElement(invocationManager, emitter, matcher) {
  if (!(matcher instanceof SystemElementMatcher)) {
    throwSystemMatcherError(matcher);
  }

  return new SystemElement(invocationManager, emitter, matcher);
}

function throwSystemMatcherError(param) {
  const paramDescription = JSON.stringify(param);
  throw new DetoxRuntimeError(`${paramDescription} is not a Detox system matcher. More about system matchers here: https://wix.github.io/Detox/docs/api/system`);
}

function systemExpect(invocationManager, element) {
  return new SystemExpect(invocationManager, element);
}

function _executeInvocation(invocationManager, invocation, traceDescription) {
  return traceInvocationCall(traceDescription, invocation, invocationManager.execute(invocation));
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
