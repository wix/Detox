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
    return await new MatcherAssertionInteraction(this._invocationManager, this._element, this._notCondition ? new matchers.VisibleMatcher(pct).not : new matchers.VisibleMatcher(pct)).execute();
  }

  async toBeNotVisible() {
    return await this.not.toBeVisible();
  }

  async toExist() {
    return await new MatcherAssertionInteraction(this._invocationManager, this._element, this._notCondition ? new matchers.ExistsMatcher().not : new matchers.ExistsMatcher()).execute();
  }

  async toNotExist() {
    return await this.not.toExist();
  }

  async toHaveText(text) {
    return await new MatcherAssertionInteraction(this._invocationManager, this._element, this._notCondition ? new matchers.TextMatcher(text).not : new matchers.TextMatcher(text)).execute();
  }

  async toNotHaveText(text) {
    return await this.not.toHaveText(text);
  }

  async toHaveLabel(value) {
    return await new MatcherAssertionInteraction(this._invocationManager, this._element, this._notCondition ? new matchers.LabelMatcher(value).not : new matchers.LabelMatcher(value)).execute();
  }

  async toNotHaveLabel(value) {
    return await this.not.toHaveLabel(value);
  }

  async toHaveId(value) {
    return await new MatcherAssertionInteraction(this._invocationManager, this._element, this._notCondition ? new matchers.IdMatcher(value).not : new matchers.IdMatcher(value)).execute();
  }

  async toNotHaveId(value) {
    return await this.not.toHaveId(value);
  }

  async toHaveValue(value) {
    return await new MatcherAssertionInteraction(this._invocationManager, this._element, this._notCondition ? new matchers.ValueMatcher(value).not : new matchers.ValueMatcher(value)).execute();
  }

  async toNotHaveValue(value) {
    return await this.not.toHaveValue(value);
  }

  async toHaveToggleValue(value) {
    return await new MatcherAssertionInteraction(this._invocationManager, this._element, this._notCondition ? new matchers.ToggleMatcher(value).not : new matchers.ToggleMatcher(value)).execute();
  }

  async toHaveSliderPosition(value, tolerance = 0) {
    return await new MatcherAssertionInteraction(this._invocationManager, this._element, this._notCondition ? new matchers.SliderPositionMatcher(value, tolerance).not : new matchers.SliderPositionMatcher(value, tolerance)).execute();
  }

  async toBeFocused() {
    return await new MatcherAssertionInteraction(this._invocationManager, this._element, this._notCondition ? new matchers.FocusMatcher().not : new matchers.FocusMatcher()).execute();
  }

  async toBeNotFocused() {
    return await this.not.toBeFocused();
  }
}

module.exports = {
  NativeExpect,
  NativeExpectElement,
};
