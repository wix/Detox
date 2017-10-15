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
