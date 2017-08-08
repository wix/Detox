const invoke = require('../invoke');

const DetoxMatcher = 'com.wix.detox.espresso.DetoxMatcher';

class Matcher {
  withAncestor(matcher) {
    if (!(matcher instanceof Matcher)) throw new Error(`Matcher withAncestor argument must be a valid Matcher, got ${typeof matcher}`);
    const _originalMatcherCall = this._call;
    this._call = invoke.call(invoke.Android.Class(DetoxMatcher), 'matcherWithAncestor', _originalMatcherCall, matcher._call);
    return this;
  }
  withDescendant(matcher) {
    if (!(matcher instanceof Matcher)) throw new Error(`Matcher withDescendant argument must be a valid Matcher, got ${typeof matcher}`);
    const _originalMatcherCall = this._call;
    this._call = invoke.call(invoke.Android.Class(DetoxMatcher), 'matcherWithDescendant', _originalMatcherCall, matcher._call);
    return this;
  }
  and(matcher) {
    if (!(matcher instanceof Matcher)) throw new Error(`Matcher and argument must be a valid Matcher, got ${typeof matcher}`);
    const _originalMatcherCall = this._call;
    this._call = invoke.call(invoke.Android.Class(DetoxMatcher), 'matcherForAnd', _originalMatcherCall, matcher._call);
    return this;
  }
  or(matcher) {
    if (!(matcher instanceof Matcher)) throw new Error(`Matcher and argument must be a valid Matcher, got ${typeof matcher}`);
    const _originalMatcherCall = this._call;
    this._call = invoke.call(invoke.Android.Class(DetoxMatcher), 'matcherForOr', _originalMatcherCall, matcher._call);
    return this;
  }
  not() {
    const _originalMatcherCall = this._call;
    this._call = invoke.call(invoke.Android.Class(DetoxMatcher), 'matcherForNot', _originalMatcherCall);
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
    if (typeof value !== 'string') throw new Error(`IdMatcher ctor argument must be a string, got ${typeof value}`);
    this._call = invoke.call(invoke.Android.Class(DetoxMatcher), 'matcherForTestId', value);
  }
}

class TypeMatcher extends Matcher {
  constructor(value) {
    super();
    if (typeof value !== 'string') throw new Error(`TypeMatcher ctor argument must be a string, got ${typeof value}`);
    this._call = invoke.call(invoke.Android.Class(DetoxMatcher), 'matcherForClass', value);
  }
}

class VisibleMatcher extends Matcher {
  constructor() {
    super();
    this._call = invoke.call(invoke.Android.Class(DetoxMatcher), 'matcherForSufficientlyVisible');
  }
}
/*
class NotVisibleMatcher extends Matcher {
  constructor() {
    super();
    this._call = invoke.call(invoke.Android.Class(DetoxMatcher), 'matcherForNotVisible');
  }
}
*/

class ExistsMatcher extends Matcher {
  constructor() {
    super();
    this._call = invoke.call(invoke.Android.Class(DetoxMatcher), 'matcherForNotNull');
  }
}

/*
class NotExistsMatcher extends Matcher {
  constructor() {
    super();
    this._call = invoke.call(invoke.Android.Class(DetoxMatcher), 'matcherForNull');
  }
}
*/

class TextMatcher extends Matcher {
  constructor(value) {
    super();
    if (typeof value !== 'string') throw new Error(`TextMatcher ctor argument must be a string, got ${typeof value}`);
    this._call = invoke.call(invoke.Android.Class(DetoxMatcher), 'matcherForText', value);
  }
}

class ValueMatcher extends Matcher {
  constructor(value) {
    super();
    if (typeof value !== 'string') throw new Error(`ValueMatcher ctor argument must be a string, got ${typeof value}`);
    this._call = invoke.call(invoke.Android.Class(DetoxMatcher), 'matcherForContentDescription', value);
  }
}

// TODO
// Please be aware, that this is just a dummy matcher
class TraitsMatcher extends Matcher {
  constructor(value) {
    super();
    if ((typeof value !== 'object') || (!value instanceof Array)) throw new Error(`TraitsMatcher ctor argument must be an array, got ${typeof value}`);
    
    this._call = invoke.call(invoke.Android.Class(DetoxMatcher), 'matcherForAnything');
  }
}

module.exports = {
  Matcher,
  LabelMatcher,
  IdMatcher,
  TypeMatcher,
  TraitsMatcher,
  VisibleMatcher,
  ExistsMatcher,
  TextMatcher,
  ValueMatcher
};
