const invoke = require('../../invoke');
const DetoxMatcherApi = require('../espressoapi/DetoxMatcher');

class NativeMatcher {
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

  get not() {
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

module.exports = {
  NativeMatcher,
};
