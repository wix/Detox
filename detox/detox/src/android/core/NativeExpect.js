const { expectDescription } = require('../../utils/invocationTraceDescriptions');
const { MatcherAssertionInteraction } = require('../interactions/native');
const matchers = require('../matchers/native');

class NativeExpect {
  constructor(invocationManager) {
    this._invocationManager = invocationManager;
  }

  get not() {
    this._notCondition = true;
    return this;
  }
}

class NativeExpectElement extends NativeExpect {
  constructor(invocationManager, element) {
    super(invocationManager);
    this._element = element;
  }

  async toBeVisible(pct) {
    const matcher = new matchers.VisibleMatcher(pct);
    const traceDescription = expectDescription.toBeVisible(pct);
    return await new MatcherAssertionInteraction(this._invocationManager, this._element, matcher, this._notCondition, traceDescription).execute();
  }

  async toBeNotVisible() {
    return await this.not.toBeVisible();
  }

  async toExist() {
    const matcher = new matchers.ExistsMatcher();
    const traceDescription = expectDescription.toExist();
    return await new MatcherAssertionInteraction(this._invocationManager, this._element, matcher, this._notCondition, traceDescription).execute();
  }

  async toNotExist() {
    return await this.not.toExist();
  }

  async toHaveText(text) {
    const matcher = new matchers.TextMatcher(text);
    const traceDescription = expectDescription.toHaveText(text);
    return await new MatcherAssertionInteraction(this._invocationManager, this._element, matcher, this._notCondition, traceDescription).execute();
  }

  async toNotHaveText(text) {
    return await this.not.toHaveText(text);
  }

  async toHaveLabel(value) {
    const matcher = new matchers.LabelMatcher(value);
    const traceDescription = expectDescription.toHaveLabel(value);
    return await new MatcherAssertionInteraction(this._invocationManager, this._element, matcher, this._notCondition, traceDescription).execute();
  }

  async toNotHaveLabel(value) {
    return await this.not.toHaveLabel(value);
  }

  async toHaveId(value) {
    const matcher = new matchers.IdMatcher(value);
    const traceDescription = expectDescription.toHaveId(value);
    return await new MatcherAssertionInteraction(this._invocationManager, this._element, matcher, this._notCondition, traceDescription).execute();
  }

  async toNotHaveId(value) {
    return await this.not.toHaveId(value);
  }

  async toHaveValue(value) {
    const matcher = new matchers.ValueMatcher(value);
    const traceDescription = expectDescription.toHaveValue(value);
    return await new MatcherAssertionInteraction(this._invocationManager, this._element, matcher, this._notCondition, traceDescription).execute();
  }

  async toNotHaveValue(value) {
    return await this.not.toHaveValue(value);
  }

  async toHaveToggleValue(value) {
    const matcher = new matchers.ToggleMatcher(value);
    const traceDescription = expectDescription.toHaveToggleValue(value);
    return await new MatcherAssertionInteraction(this._invocationManager, this._element, matcher, this._notCondition, traceDescription).execute();
  }

  async toHaveSliderPosition(value, tolerance = 0) {
    const matcher = new matchers.SliderPositionMatcher(value, tolerance);
    const traceDescription = expectDescription.toHaveSliderPosition(value, tolerance);
    return await new MatcherAssertionInteraction(this._invocationManager, this._element, matcher, this._notCondition, traceDescription).execute();
  }

  async toBeFocused() {
    const matcher = new matchers.FocusMatcher();
    const traceDescription = expectDescription.toBeFocused();
    return await new MatcherAssertionInteraction(this._invocationManager, this._element, matcher, this._notCondition, traceDescription).execute();
  }

  async toBeNotFocused() {
    return await this.not.toBeFocused();
  }
}

module.exports = {
  NativeExpect,
  NativeExpectElement,
};
