const invoke = require('../invoke');

class Matcher {
  withAncestor(matcher) {
    if (!(matcher instanceof Matcher)) throw new Error(`Matcher withAncestor argument must be a valid Matcher, got ${typeof matcher}`);
    const _originalMatcherCall = this._call;
    this._call = invoke.call(invoke.IOS.Class('GREYMatchers'), 'detoxMatcherForBoth:andAncestorMatcher:', _originalMatcherCall, matcher._call);
    return this;
  }
  withDescendant(matcher) {
    if (!(matcher instanceof Matcher)) throw new Error(`Matcher withDescendant argument must be a valid Matcher, got ${typeof matcher}`);
    const _originalMatcherCall = this._call;
    this._call = invoke.call(invoke.IOS.Class('GREYMatchers'), 'detoxMatcherForBoth:andDescendantMatcher:', _originalMatcherCall, matcher._call);
    return this;
  }
  and(matcher) {
    if (!(matcher instanceof Matcher)) throw new Error(`Matcher and argument must be a valid Matcher, got ${typeof matcher}`);
    const _originalMatcherCall = this._call;
    this._call = invoke.call(invoke.IOS.Class('GREYMatchers'), 'detoxMatcherForBoth:and:', _originalMatcherCall, matcher._call);
    return this;
  }
  not() {
    const _originalMatcherCall = this._call;
    this._call = invoke.call(invoke.IOS.Class('GREYMatchers'), 'detoxMatcherForNot:', _originalMatcherCall);
    return this;
  }
  _avoidProblematicReactNativeElements() {
    const _originalMatcherCall = this._call;
    this._call = invoke.call(invoke.IOS.Class('GREYMatchers'), 'detoxMatcherAvoidingProblematicReactNativeElements:', _originalMatcherCall);
    return this;
  }
  _extendToDescendantScrollViews() {
    const _originalMatcherCall = this._call;
    this._call = invoke.call(invoke.IOS.Class('GREYMatchers'), 'detoxMatcherForScrollChildOfMatcher:', _originalMatcherCall);
    return this;
  }
}

class LabelMatcher extends Matcher {
  constructor(value) {
    super();
    if (typeof value !== 'string') throw new Error(`LabelMatcher ctor argument must be a string, got ${typeof value}`);
    this._call = invoke.call(invoke.IOS.Class('GREYMatchers'), 'matcherForAccessibilityLabel:', value);
  }
}

class IdMatcher extends Matcher {
  constructor(value) {
    super();
    if (typeof value !== 'string') throw new Error(`IdMatcher ctor argument must be a string, got ${typeof value}`);
    this._call = invoke.call(invoke.IOS.Class('GREYMatchers'), 'matcherForAccessibilityID:', value);
  }
}

class TypeMatcher extends Matcher {
  constructor(value) {
    super();
    if (typeof value !== 'string') throw new Error(`TypeMatcher ctor argument must be a string, got ${typeof value}`);
    this._call = invoke.call(invoke.IOS.Class('GREYMatchers'), 'detoxMatcherForClass:', value);
  }
}

class TraitsMatcher extends Matcher {
  constructor(value) {
    super();
    if ((typeof value !== 'object') || (!value instanceof Array)) throw new Error(`TraitsMatcher ctor argument must be an array, got ${typeof value}`);
    let traits = 0;
    for (let i = 0; i < value.length; i++) {
      switch (value[i]) {
        case 'button': traits |= 1; break;
        case 'link': traits |= 2; break;
        case 'header': traits |= 4; break;
        case 'search': traits |= 8; break;
        case 'image': traits |= 16; break;
        case 'selected': traits |= 32; break;
        case 'plays': traits |= 64; break;
        case 'key': traits |= 128; break;
        case 'text': traits |= 256; break;
        case 'summary': traits |= 512; break;
        case 'disabled': traits |= 1024; break;
        case 'frequentUpdates': traits |= 2048; break;
        case 'startsMedia': traits |= 4096; break;
        case 'adjustable': traits |= 8192; break;
        case 'allowsDirectInteraction': traits |= 16384; break;
        case 'pageTurn': traits |= 32768; break;
        default: throw new Error(`Unknown trait '${value[i]}', see list in https://facebook.github.io/react-native/docs/accessibility.html#accessibilitytraits-ios`);
      }
    }
    this._call = invoke.call(invoke.IOS.Class('GREYMatchers'), 'matcherForAccessibilityTraits:', invoke.IOS.NSInteger(traits));
  }
}

class VisibleMatcher extends Matcher {
  constructor() {
    super();
    this._call = invoke.call(invoke.IOS.Class('GREYMatchers'), 'matcherForSufficientlyVisible');
  }
}

class NotVisibleMatcher extends Matcher {
  constructor() {
    super();
    this._call = invoke.call(invoke.IOS.Class('GREYMatchers'), 'matcherForNotVisible');
  }
}

class ExistsMatcher extends Matcher {
  constructor() {
    super();
    this._call = invoke.call(invoke.IOS.Class('GREYMatchers'), 'matcherForNotNil');
  }
}

class NotExistsMatcher extends Matcher {
  constructor() {
    super();
    this._call = invoke.call(invoke.IOS.Class('GREYMatchers'), 'matcherForNil');
  }
}

class TextMatcher extends Matcher {
  constructor(value) {
    super();
    if (typeof value !== 'string') throw new Error(`TextMatcher ctor argument must be a string, got ${typeof value}`);
    this._call = invoke.call(invoke.IOS.Class('GREYMatchers'), 'detoxMatcherForText:', value);
  }
}

class ValueMatcher extends Matcher {
  constructor(value) {
    super();
    if (typeof value !== 'string') throw new Error(`ValueMatcher ctor argument must be a string, got ${typeof value}`);
    this._call = invoke.call(invoke.IOS.Class('GREYMatchers'), 'matcherForAccessibilityValue:', value);
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
