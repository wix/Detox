const invoke = require('../../invoke');
const DetoxMatcherApi = require('../espressoapi/DetoxMatcher');

class NativeMatcher {
  constructor(call) {
    this._call = call || null;
  }

  withAncestor(matcher) {
    const call = invoke.callDirectly(DetoxMatcherApi.matcherWithAncestor(this, matcher));
    return new NativeMatcher(call);
  }

  withDescendant(matcher) {
    const call = invoke.callDirectly(DetoxMatcherApi.matcherWithDescendant(this, matcher));
    return new NativeMatcher(call);
  }

  and(matcher) {
    const call = invoke.callDirectly(DetoxMatcherApi.matcherForAnd(this, matcher));
    return new NativeMatcher(call);
  }

  or(matcher) {
    const call = invoke.callDirectly(DetoxMatcherApi.matcherForOr(this, matcher));
    return new NativeMatcher(call);
  }

  get not() {
    const call = invoke.callDirectly(DetoxMatcherApi.matcherForNot(this));
    return new NativeMatcher(call);
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
