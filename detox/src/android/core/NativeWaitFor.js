const { WaitForInteraction } = require('../interactions/native');
const matchers = require('../matchers/native');

class NativeWaitFor {
  constructor(invocationManager) {
    this._invocationManager = invocationManager;
  }
}

class NativeWaitForElement extends NativeWaitFor {
  constructor(invocationManager, element) {
    super(invocationManager);
    this._element = element;
  }

  get not() {
    this._notCondition = true;
    return this;
  }

  toBeVisible(pct) {
    return new WaitForInteraction(this._invocationManager, this._element, this._notCondition ? new matchers.VisibleMatcher(pct).not : new matchers.VisibleMatcher(pct));
  }

  toBeNotVisible() {
    return this.not.toBeVisible();
  }

  toExist() {
    return new WaitForInteraction(this._invocationManager, this._element, this._notCondition ? new matchers.ExistsMatcher().not : new matchers.ExistsMatcher());
  }

  toNotExist() {
    return this.not.toExist();
  }

  toHaveText(text) {
    return new WaitForInteraction(this._invocationManager, this._element, this._notCondition ? new matchers.TextMatcher(text).not : new matchers.TextMatcher(text));
  }

  toNotHaveText(text) {
    return this.not.toHaveText(text);
  }

  toHaveLabel(value) {
    return new WaitForInteraction(this._invocationManager, this._element, this._notCondition ? new matchers.LabelMatcher(value).not : new matchers.LabelMatcher(value));
  }

  toNotHaveLabel(value) {
    return this.not.toHaveLabel(value);
  }

  toHaveId(value) {
    return new WaitForInteraction(this._invocationManager, this._element, this._notCondition ? new matchers.IdMatcher(value).not : new matchers.IdMatcher(value));
  }

  toNotHaveId(value) {
    return this.not.toHaveId(value);
  }

  toHaveValue(value) {
    return new WaitForInteraction(this._invocationManager, this._element, this._notCondition ? new matchers.ValueMatcher(value).not : new matchers.ValueMatcher(value));
  }

  toNotHaveValue(value) {
    return this.not.toHaveValue(value);
  }

  toBeFocused() {
    return new WaitForInteraction(this._invocationManager, this._element, this._notCondition ? new matchers.FocusMatcher().not : new matchers.FocusMatcher());
  }

  toBeNotFocused() {
    return this.not.toBeFocused();
  }
}

module.exports = {
  NativeWaitFor,
  NativeWaitForElement,
};
