const DetoxRuntimeError = require('../../errors/DetoxRuntimeError');
const invoke = require('../../invoke');
const DetoxMatcherApi = require('../espressoapi/DetoxMatcher');
const { NativeMatcher } = require('../core/NativeMatcher');

class LabelMatcher extends NativeMatcher {
  constructor(value) {
    super();
    this._call = invoke.callDirectly(DetoxMatcherApi.matcherForContentDescription(value));
  }
}

class IdMatcher extends NativeMatcher {
  constructor(value) {
    super();
    this._call = invoke.callDirectly(DetoxMatcherApi.matcherForTestId(value));
  }
}

class TypeMatcher extends NativeMatcher {
  constructor(value) {
    super();
    this._call = invoke.callDirectly(DetoxMatcherApi.matcherForClass(value));
  }
}

class VisibleMatcher extends NativeMatcher {
  constructor() {
    super();
    this._call = invoke.callDirectly(DetoxMatcherApi.matcherForSufficientlyVisible());
  }
}

class ExistsMatcher extends NativeMatcher {
  constructor() {
    super();
    this._call = invoke.callDirectly(DetoxMatcherApi.matcherForNotNull());
  }
}

class TextMatcher extends NativeMatcher {
  constructor(value) {
    super();
    this._call = invoke.callDirectly(DetoxMatcherApi.matcherForText(value));
  }
}

class ValueMatcher extends NativeMatcher {
  constructor(value) {
    super();
    this._call = invoke.callDirectly(DetoxMatcherApi.matcherForContentDescription(value));
  }
}

class ToggleMatcher extends NativeMatcher {
  constructor(toggleState) {
    super();
    this._call = invoke.callDirectly(DetoxMatcherApi.matcherForToggleable(toggleState));
  }
}

// TODO
// Please be aware, that this is just a dummy matcher
class TraitsMatcher extends NativeMatcher {
  constructor(value) {
    super();
    if ((typeof value !== 'object') || (!value instanceof Array)) throw new DetoxRuntimeError(`TraitsMatcher ctor argument must be an array, got ${typeof value}`);

    this._call = invoke.callDirectly(DetoxMatcherApi.matcherForAnything());
  }
}

module.exports = {
  LabelMatcher,
  IdMatcher,
  TypeMatcher,
  TraitsMatcher,
  VisibleMatcher,
  ExistsMatcher,
  TextMatcher,
  ValueMatcher,
  ToggleMatcher,
};
