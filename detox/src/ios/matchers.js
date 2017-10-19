const invoke = require('../invoke');
const GreyMatchers = require('./earlgreyapi/GREYMatchers');
const GreyMatchersDetox = require('./earlgreyapi/GREYMatchers+Detox');

class Matcher {
  withAncestor(matcher) {
    const _originalMatcherCall = this._call;
    this._call = invoke.callDirectly(GreyMatchersDetox.detoxMatcherForBothAndAncestorMatcher(_originalMatcherCall, matcher._call));
    return this;
  }
  withDescendant(matcher) {
    const _originalMatcherCall = this._call;
    this._call = invoke.callDirectly(GreyMatchersDetox.detoxMatcherForBothAndDescendantMatcher(_originalMatcherCall, matcher._call));
    return this;
  }
  and(matcher) {
    const _originalMatcherCall = this._call;
    this._call = invoke.callDirectly(GreyMatchersDetox.detoxMatcherForBothAnd(_originalMatcherCall, matcher._call));
    return this;
  }
  not() {
    const _originalMatcherCall = this._call;
    this._call = invoke.callDirectly(GreyMatchersDetox.detoxMatcherForNot(_originalMatcherCall));
    return this;
  }
  _avoidProblematicReactNativeElements() {
    const _originalMatcherCall = this._call;
    this._call = invoke.callDirectly(GreyMatchersDetox.detoxMatcherAvoidingProblematicReactNativeElements(_originalMatcherCall));
    return this;
  }
  _extendToDescendantScrollViews() {
    const _originalMatcherCall = this._call;
    this._call = invoke.callDirectly(GreyMatchersDetox.detoxMatcherForScrollChildOfMatcher(_originalMatcherCall));
    return this;
  }
}

class LabelMatcher extends Matcher {
  constructor(value) {
    super();
    this._call = invoke.callDirectly(GreyMatchersDetox.detox_matcherForAccessibilityLabel(value));
  }
}

class IdMatcher extends Matcher {
  constructor(value) {
    super();
    this._call = invoke.callDirectly(GreyMatchers.matcherForAccessibilityID(value));
  }
}

class TypeMatcher extends Matcher {
  constructor(value) {
    super();
    this._call = invoke.callDirectly(GreyMatchersDetox.detoxMatcherForClass(value));
  }
}

class TraitsMatcher extends Matcher {
  constructor(value) {
    super();
    this._call = invoke.callDirectly(GreyMatchers.matcherForAccessibilityTraits(value));
  }
}

class VisibleMatcher extends Matcher {
  constructor() {
    super();
    this._call = invoke.callDirectly(GreyMatchers.matcherForSufficientlyVisible());
  }
}

class NotVisibleMatcher extends Matcher {
  constructor() {
    super();
    this._call = invoke.callDirectly(GreyMatchers.matcherForNotVisible());
  }
}

class ExistsMatcher extends Matcher {
  constructor() {
    super();
    this._call = invoke.callDirectly(GreyMatchers.matcherForNotNil());
  }
}

class NotExistsMatcher extends Matcher {
  constructor() {
    super();
    this._call = invoke.callDirectly(GreyMatchers.matcherForNil());
  }
}

class TextMatcher extends Matcher {
  constructor(value) {
    super();
    this._call = invoke.callDirectly(GreyMatchersDetox.detoxMatcherForText(value));
  }
}

class ValueMatcher extends Matcher {
  constructor(value) {
    super();
    this._call = invoke.callDirectly(GreyMatchers.matcherForAccessibilityValue(value));
  }
}

module.exports = {
  Matcher,
  LabelMatcher,
  IdMatcher,
  TypeMatcher,
  TraitsMatcher,
  VisibleMatcher,
  NotVisibleMatcher,
  ExistsMatcher,
  NotExistsMatcher,
  TextMatcher,
  ValueMatcher
};
