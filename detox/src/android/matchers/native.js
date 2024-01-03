const DetoxRuntimeError = require('../../errors/DetoxRuntimeError');
const invoke = require('../../invoke');
const { isRegExp } = require('../../utils/isRegExp');
const { NativeMatcher } = require('../core/NativeMatcher');
const DetoxMatcherApi = require('../espressoapi/DetoxMatcher');

class LabelMatcher extends NativeMatcher {
  constructor(value) {
    super();
    const isRegex = isRegExp(value);
    this._call = invoke.callDirectly(DetoxMatcherApi.matcherForAccessibilityLabel(isRegex ? value.toString() : value, isRegex));
  }
}

class ShallowLabelMatcher extends NativeMatcher {
  constructor(value) {
    super();
    const isRegex = isRegExp(value);
    this._call = invoke.callDirectly(DetoxMatcherApi.matcherForShallowAccessibilityLabel(isRegex ? value.toString() : value, isRegex));
  }
}

class IdMatcher extends NativeMatcher {
  constructor(value) {
    super();
    const isRegex = isRegExp(value);
    this._call = invoke.callDirectly(DetoxMatcherApi.matcherForTestId(isRegex ? value.toString() : value, isRegex));
  }
}

class TypeMatcher extends NativeMatcher {
  constructor(value) {
    super();
    this._call = invoke.callDirectly(DetoxMatcherApi.matcherForClass(value));
  }
}

class VisibleMatcher extends NativeMatcher {
  constructor(pct = 75) {
    super();

    if (pct !== undefined && (!Number.isSafeInteger(pct) || pct < 1 || pct > 100)) {
      throw new DetoxRuntimeError('VisibleMatcher argument must be an integer between 1 and 100');
    }

    this._call = invoke.callDirectly(DetoxMatcherApi.matcherForSufficientlyVisible(pct));
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
    const isRegex = isRegExp(value);
    this._call = invoke.callDirectly(DetoxMatcherApi.matcherForText(isRegex ? value.toString() : value, isRegex));
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

// NOTE: Please be aware, that this is just a dummy matcher
class TraitsMatcher extends NativeMatcher {
  constructor(value) {
    super();
    if (!Array.isArray(value)) throw new DetoxRuntimeError(`TraitsMatcher ctor argument must be an array, got ${typeof value}`);

    this._call = invoke.callDirectly(DetoxMatcherApi.matcherForAnything());
  }
}

class FocusMatcher extends NativeMatcher {
  constructor() {
    super();
    this._call = invoke.callDirectly(DetoxMatcherApi.matcherForFocus());
  }
}

class SliderPositionMatcher extends NativeMatcher {
  constructor(value, tolerance) {
    super();
    this._call = invoke.callDirectly(DetoxMatcherApi.matcherForSliderPosition(value, tolerance));
  }
}

module.exports = {
  LabelMatcher,
  ShallowLabelMatcher,
  IdMatcher,
  TypeMatcher,
  TraitsMatcher,
  VisibleMatcher,
  ExistsMatcher,
  TextMatcher,
  ValueMatcher,
  ToggleMatcher,
  FocusMatcher,
  SliderPositionMatcher,
};
