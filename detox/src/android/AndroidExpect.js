const { Element, ExpectElement, WaitForElement } = require('./core/native');
const matchers = require('./matchers/native');

class AndroidExpect {
  constructor({ invocationManager, emitter }) {
    this._invocationManager = invocationManager;
    this._emitter = emitter;

    this.by = {
      accessibilityLabel: value => new matchers.LabelMatcher(value),
      label: value => new matchers.LabelMatcher(value),
      id: value => new matchers.IdMatcher(value),
      type: value => new matchers.TypeMatcher(value),
      traits: value => new matchers.TraitsMatcher(value),
      value: value => new matchers.ValueMatcher(value),
      text: value => new matchers.TextMatcher(value)
    };

    this.element = this.element.bind(this);
    this.expect = this.expect.bind(this);
    this.waitFor = this.waitFor.bind(this);
  }


  element(matcher) {
    return new Element(this._invocationManager, this._emitter, matcher);
  }

  expect(element) {
    if (element instanceof Element) return new ExpectElement(this._invocationManager, element);
    throw new Error(`expect() argument is invalid, got ${typeof element}`);
  }

  waitFor(element) {
    if (element instanceof Element) return new WaitForElement(this._invocationManager, element);
    throw new Error(`waitFor() argument is invalid, got ${typeof element}`);
  }
}

module.exports = AndroidExpect;
