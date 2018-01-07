const invoke = require('../invoke');
const DetoxMatcherApi = require('./espressoapi/DetoxMatcher');

const DetoxMatcher = 'com.wix.detox.espresso.DetoxMatcher';

class Matcher {
  withAncestor(matcher) {
    this._call = invoke.callDirectly(DetoxMatcherApi.matcherWithAncestor(this, matcher));
    return this;
  }
  withDescendant(matcher) {
    this._call = invoke.callDirectly(DetoxMatcherApi.matcherWithDescendant(this, matcher));
    return this;
  }
  and(matcher) {
    this._call = invoke.callDirectly(DetoxMatcherApi.matcherForAnd(this, matcher));
    return this;
  }
  or(matcher) {
    this._call = invoke.callDirectly(DetoxMatcherApi.matcherForOr(this, matcher));
    return this;
  }
  not() {
    this._call = invoke.callDirectly(DetoxMatcherApi.matcherForNot(this));
    return this;
  }
  
  _avoidProblematicReactNativeElements() {
    /*
    const _originalMatcherCall = this._call;
    this._call = invoke.call(invoke.IOS.Class('GREYMatchers'), 'detoxMatcherAvoidingProblematicReactNativeElements:', _originalMatcherCall);
    */
    return this;
  }
  _extendToDescendantScrollViews() {
    /*
    const _originalMatcherCall = this._call;
    this._call = invoke.call(invoke.IOS.Class('GREYMatchers'), 'detoxMatcherForScrollChildOfMatcher:', _originalMatcherCall);
    */
    return this;
  }
  
}

class LabelMatcher extends Matcher {
  constructor(value) {
    super();
    if (typeof value !== 'string') throw new Error(`LabelMatcher ctor argument must be a string, got ${typeof value}`);
    this._call = invoke.call(invoke.Android.Class(DetoxMatcher), 'matcherForContentDescription', value);
  }
}

class IdMatcher extends Matcher {
  constructor(value) {
    super();
    this._call = invoke.callDirectly(DetoxMatcherApi.matcherForTestId(value));
  }
}

class TypeMatcher extends Matcher {
  constructor(value) {
    super();
    this._call = invoke.callDirectly(DetoxMatcherApi.matcherForClass(value));
  }
}

class VisibleMatcher extends Matcher {
  constructor() {
    super();
    this._call = invoke.callDirectly(DetoxMatcherApi.matcherForSufficientlyVisible());
  }
}

class NotVisibleMatcher extends Matcher {
  constructor() {
    super();
    this._call = invoke.callDirectly(DetoxMatcherApi.matcherForNotVisible());
  }
}

class ExistsMatcher extends Matcher {
  constructor() {
    super();
    this._call = invoke.callDirectly(DetoxMatcherApi.matcherForNotNull());
  }
}

class NotExistsMatcher extends Matcher {
  constructor() {
    super();
    this._call = invoke.callDirectly(DetoxMatcherApi.matcherForNull());
  }
}

class TextMatcher extends Matcher {
  constructor(value) {
    super();
    this._call = invoke.callDirectly(DetoxMatcherApi.matcherForText(value));
  }
}

class ValueMatcher extends Matcher {
  constructor(value) {
    super();
    this._call = invoke.callDirectly(DetoxMatcherApi.matcherForContentDescription(value));
  }
}

// TODO
// Please be aware, that this is just a dummy matcher
class TraitsMatcher extends Matcher {
  constructor(value) {
    super();
    if ((typeof value !== 'object') || (!value instanceof Array)) throw new Error(`TraitsMatcher ctor argument must be an array, got ${typeof value}`);

    this._call = invoke.callDirectly(DetoxMatcherApi.matcherForAnything());
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
