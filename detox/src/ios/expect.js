const invoke = require('../invoke');

//// examples

/*

element(by.label('Click Me')).tap();
[[EarlGrey selectElementWithMatcher:grey_accessibilityLabel(@"Click Me")] performAction:grey_tap()];
const _getMatcher1 = detox.invoke.call(detox.invoke.IOS.Class('GREYMatchers'), 'matcherForAccessibilityLabel:', 'Click Me');
const _getElement1 = detox.invoke.call(detox.invoke.EarlGrey.instance, 'selectElementWithMatcher:', _getMatcher1);
const _getAction1 = detox.invoke.call(detox.invoke.IOS.Class('GREYActions'), 'actionForTap');
const _getInteraction1 = detox.invoke.call(_getElement1, 'performAction:', _getAction1);
detox.invoke.execute(_getInteraction1);

expect(element(by.label('Yay'))).toBeVisible();
[[EarlGrey selectElementWithMatcher:grey_accessibilityLabel(@"Yay")] assertWithMatcher:grey_sufficientlyVisible()];
const _getMatcher2 = detox.invoke.call(detox.invoke.IOS.Class('GREYMatchers'), 'matcherForAccessibilityLabel:', 'Yay');
const _getElement2 = detox.invoke.call(detox.invoke.EarlGrey.instance, 'selectElementWithMatcher:', _getMatcher2);
const _getAssertMatcher2 = detox.invoke.call(detox.invoke.IOS.Class('GREYMatchers'), 'matcherForSufficientlyVisible');
const _getInteraction2 = detox.invoke.call(_getElement2, 'assertWithMatcher:', _getAssertMatcher2);
detox.invoke.execute(_getInteraction2);

*/

//// classes

class Matcher {
  withAncestor(matcher) {
    if (!matcher instanceof Matcher) throw new Error(`Matcher withAncestor argument must be a valid Matcher, got ${typeof matcher}`);
    const _originalMatcherCall = this._call;
    this._call = invoke.call(invoke.IOS.Class('GREYMatchers'), 'detoxMatcherForBoth:andAncestorMatcher:', _originalMatcherCall, matcher._call);
    return this;
  }
  withDescendant(matcher) {
    if (!matcher instanceof Matcher) throw new Error(`Matcher withDescendant argument must be a valid Matcher, got ${typeof matcher}`);
    const _originalMatcherCall = this._call;
    this._call = invoke.call(invoke.IOS.Class('GREYMatchers'), 'detoxMatcherForBoth:andDescendantMatcher:', _originalMatcherCall, matcher._call);
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

// TODO: maybe refactor this and move into a member of Matcher class
class ExtendedScrollMatcher extends Matcher {
  constructor(matcher) {
    super();
    if (!matcher instanceof Matcher) throw new Error(`ExtendedScrollMatcher ctor argument must be a valid Matcher, got ${typeof matcher}`);
    this._call = invoke.call(invoke.IOS.Class('GREYMatchers'), 'detoxMatcherForScrollChildOfMatcher:', matcher._call);
  }
}

// TODO: maybe refactor this and move into a member of Matcher class
class CombineBothMatcher extends Matcher {
  constructor(firstMatcher, secondMatcher) {
    super();
    if (!firstMatcher instanceof Matcher) throw new Error(`CombineBothMatcher ctor 1st argument must be a valid Matcher, got ${typeof firstMatcher}`);
    if (!secondMatcher instanceof Matcher) throw new Error(`CombineBothMatcher ctor 2nd argument must be a valid Matcher, got ${typeof secondMatcher}`);
    this._call = invoke.call(invoke.IOS.Class('GREYMatchers'), 'detoxMatcherForBoth:and:', firstMatcher._call, secondMatcher._call);
  }
}

// TODO: maybe refactor this and move into a member of Matcher class
class NotMatcher extends Matcher {
  constructor(matcher) {
    super();
    if (!matcher instanceof Matcher) throw new Error(`NotMatcher ctor argument must be a valid Matcher, got ${typeof matcher}`);
    this._call = invoke.call(invoke.IOS.Class('GREYMatchers'), 'detoxMatcherForNot:', matcher._call);
  }
}

class Action {}

class TapAction extends Action {
  constructor() {
    super();
    this._call = invoke.call(invoke.IOS.Class('GREYActions'), 'actionForTap');
  }
}

class LongPressAction extends Action {
  constructor() {
    super();
    this._call = invoke.call(invoke.IOS.Class('GREYActions'), 'actionForLongPress');
  }
}

class MultiTapAction extends Action {
  constructor(value) {
    super();
    if (typeof value !== 'number') throw new Error(`MultiTapAction ctor argument must be a number, got ${typeof value}`);
    this._call = invoke.call(invoke.IOS.Class('GREYActions'), 'actionForMultipleTapsWithCount:', invoke.IOS.NSInteger(value));
  }
}

class TypeTextAction extends Action {
  constructor(value) {
    super();
    if (typeof value !== 'string') throw new Error(`TypeTextAction ctor argument must be a string, got ${typeof value}`);
    this._call = invoke.call(invoke.IOS.Class('GREYActions'), 'actionForTypeText:', value);
  }
}

class ClearTextAction extends Action {
  constructor() {
    super();
    this._call = invoke.call(invoke.IOS.Class('GREYActions'), 'actionForClearText');
  }
}

class ScrollAmountAction extends Action {
  constructor(direction, amount) {
    super();
    if (typeof direction !== 'string') throw new Error(`ScrollAmountAction ctor 1st argument must be a string, got ${typeof direction}`);
    switch (direction) {
      case 'left': direction = 1; break;
      case 'right': direction = 2; break;
      case 'up': direction = 3; break;
      case 'down': direction = 4; break;
      default: throw new Error(`ScrollAmountAction direction must be a 'left'/'right'/'up'/'down', got ${direction}`);
    }
    if (typeof amount !== 'number') throw new Error(`ScrollAmountAction ctor 2nd argument must be a number, got ${typeof amount}`);
    this._call = invoke.call(invoke.IOS.Class('GREYActions'), 'actionForScrollInDirection:amount:', invoke.IOS.NSInteger(direction), invoke.IOS.CGFloat(amount));
  }
}

class ScrollEdgeAction extends Action {
  constructor(edge) {
    super();
    if (typeof edge !== 'string') throw new Error(`ScrollEdgeAction ctor 1st argument must be a string, got ${typeof edge}`);
    switch (edge) {
      case 'left': edge = 0; break;
      case 'right': edge = 1; break;
      case 'top': edge = 2; break;
      case 'bottom': edge = 3; break;
      default: throw new Error(`ScrollEdgeAction edge must be a 'left'/'right'/'top'/'bottom', got ${edge}`);
    }
    this._call = invoke.call(invoke.IOS.Class('GREYActions'), 'actionForScrollToContentEdge:', invoke.IOS.NSInteger(edge));
  }
}

class Interaction {
  execute() {
    if (!this._call) throw new Error(`Interaction.execute cannot find a valid _call, got ${typeof this._call}`);
    invoke.execute(this._call);
  }
}

class ActionInteraction extends Interaction {
  constructor(element, action) {
    super();
    if (!element instanceof Element) throw new Error(`ActionInteraction ctor 1st argument must be a valid Element, got ${typeof element}`);
    if (!action instanceof Action) throw new Error(`ActionInteraction ctor 2nd argument must be a valid Action, got ${typeof action}`);
    this._call = invoke.call(element._call, 'performAction:', action._call);
    // TODO: move this.execute() here from the caller
  }
}

class MatcherAssertionInteraction extends Interaction {
  constructor(element, matcher) {
    super();
    if (!element instanceof Element) throw new Error(`MatcherAssertionInteraction ctor 1st argument must be a valid Element, got ${typeof element}`);
    if (!matcher instanceof Matcher) throw new Error(`MatcherAssertionInteraction ctor 2nd argument must be a valid Matcher, got ${typeof matcher}`);
    this._call = invoke.call(element._call, 'assertWithMatcher:', matcher._call);
    // TODO: move this.execute() here from the caller
  }
}

class WaitForInteraction extends Interaction {
  constructor(element, matcher) {
    super();
    if (!element instanceof Element) throw new Error(`WaitForInteraction ctor 1st argument must be a valid Element, got ${typeof element}`);
    if (!matcher instanceof Matcher) throw new Error(`WaitForInteraction ctor 2nd argument must be a valid Matcher, got ${typeof matcher}`);
    this._element = element;
    this._originalMatcher = matcher;
    // we need to override the original matcher for the element and add matcher to it as well
    this._element._selectElementWithMatcher(new CombineBothMatcher(this._element._originalMatcher, this._originalMatcher));
  }
  _not() {
    this._notCondition = true;
    return this;
  }
  withTimeout(timeout) {
    if (typeof timeout !== 'number') throw new Error(`WaitForInteraction withTimeout argument must be a number, got ${typeof timeout}`);
    let _conditionCall = invoke.call(invoke.IOS.Class('GREYCondition'), 'detoxConditionForElementMatched:', this._element._call);
    if (this._notCondition) {
      _conditionCall = invoke.call(invoke.IOS.Class('GREYCondition'), 'detoxConditionForNotElementMatched:', this._element._call);
    }
    this._call = invoke.call(_conditionCall, 'waitWithTimeout:', invoke.IOS.CGFloat(timeout));
    this.execute();
  }
  whileElement(searchMatcher) {
    return new WaitForActionInteraction(this._element, this._originalMatcher, searchMatcher);
  }
}

class WaitForActionInteraction extends Interaction {
  constructor(element, matcher, searchMatcher) {
    super();
    if (!element instanceof Element) throw new Error(`WaitForActionInteraction ctor 1st argument must be a valid Element, got ${typeof element}`);
    if (!matcher instanceof Matcher) throw new Error(`WaitForActionInteraction ctor 2nd argument must be a valid Matcher, got ${typeof matcher}`);
    if (!searchMatcher instanceof Matcher) throw new Error(`WaitForActionInteraction ctor 3rd argument must be a valid Matcher, got ${typeof searchMatcher}`);
    this._element = element;
    this._originalMatcher = matcher;
    this._searchMatcher = searchMatcher;
  }
  _execute(searchAction) {
    if (!searchAction instanceof Action) throw new Error(`WaitForActionInteraction _execute argument must be a valid Action, got ${typeof searchAction}`);
    const _interactionCall = invoke.call(this._element._call, 'usingSearchAction:onElementWithMatcher:', searchAction._call, this._searchMatcher._call);
    this._call = invoke.call(_interactionCall, 'assertWithMatcher:', this._originalMatcher._call);
    this.execute();
  }
  scroll(amount, direction = 'down') {
    // override the user's element selection with an extended matcher that looks for UIScrollView children
    this._searchMatcher = new ExtendedScrollMatcher(this._searchMatcher);
    this._execute(new ScrollAmountAction(direction, amount));
  }
}

class Element {
  constructor(matcher) {
    this._originalMatcher = matcher;
    this._selectElementWithMatcher(this._originalMatcher);
  }
  _selectElementWithMatcher(matcher) {
    if (!matcher instanceof Matcher) throw new Error(`Element _selectElementWithMatcher argument must be a valid Matcher, got ${typeof matcher}`);
    this._call = invoke.call(invoke.EarlGrey.instance, 'selectElementWithMatcher:', matcher._call);
  }
  tap() {
    return new ActionInteraction(this, new TapAction()).execute();
  }
  longPress() {
    return new ActionInteraction(this, new LongPressAction()).execute();
  }
  multiTap(value) {
    return new ActionInteraction(this, new MultiTapAction(value)).execute();
  }
  typeText(value) {
    return new ActionInteraction(this, new TypeTextAction(value)).execute();
  }
  clearText() {
    return new ActionInteraction(this, new ClearTextAction()).execute();
  }
  scroll(amount, direction = 'down') {
    // override the user's element selection with an extended matcher that looks for UIScrollView children
    this._selectElementWithMatcher(new ExtendedScrollMatcher(this._originalMatcher));
    return new ActionInteraction(this, new ScrollAmountAction(direction, amount)).execute();
  }
  scrollTo(edge) {
    // override the user's element selection with an extended matcher that looks for UIScrollView children
    this._selectElementWithMatcher(new ExtendedScrollMatcher(this._originalMatcher));
    return new ActionInteraction(this, new ScrollEdgeAction(edge)).execute();
  }
}

class Expect {}

class ExpectElement extends Expect {
  constructor(element) {
    super();
    if (!element instanceof Element) throw new Error(`ExpectElement ctor argument must be a valid Element, got ${typeof element}`);
    this._element = element;
  }
  toBeVisible() {
    return new MatcherAssertionInteraction(this._element, new VisibleMatcher()).execute();
  }
  toBeNotVisible() {
    return new MatcherAssertionInteraction(this._element, new NotVisibleMatcher()).execute();
  }
  toExist() {
    return new MatcherAssertionInteraction(this._element, new ExistsMatcher()).execute();
  }
  toNotExist() {
    return new MatcherAssertionInteraction(this._element, new NotExistsMatcher()).execute();
  }
  toHaveText(value) {
    return new MatcherAssertionInteraction(this._element, new TextMatcher(value)).execute();
  }
  toHaveLabel(value) {
    return new MatcherAssertionInteraction(this._element, new LabelMatcher(value)).execute();
  }
  toHaveId(value) {
    return new MatcherAssertionInteraction(this._element, new IdMatcher(value)).execute();
  }
}

class WaitFor {}

class WaitForElement extends WaitFor {
  constructor(element) {
    super();
    if (!element instanceof Element) throw new Error(`WaitForElement ctor argument must be a valid Element, got ${typeof element}`);
    this._element = element;
  }
  toBeVisible() {
    return new WaitForInteraction(this._element, new VisibleMatcher());
  }
  toBeNotVisible() {
    return new WaitForInteraction(this._element, new VisibleMatcher())._not();
  }
  toExist() {
    return new WaitForInteraction(this._element, new ExistsMatcher());
  }
  toNotExist() {
    return new WaitForInteraction(this._element, new ExistsMatcher())._not();
  }
}

//// syntax

function expect(element) {
  if (element instanceof Element) return new ExpectElement(element);
  throw new Error(`expect() argument is invalid, got ${typeof element}`);
}

function waitFor(element) {
  if (element instanceof Element) return new WaitForElement(element);
  throw new Error(`waitFor() argument is invalid, got ${typeof element}`);
}

function element(matcher) {
  return new Element(matcher);
}

const by = {
  label: (value) => new LabelMatcher(value),
  id: (value) => new IdMatcher(value),
  type: (value) => new TypeMatcher(value)
};

const exportGlobals = function () {
  global.element = element;
  global.expect = expect;
  global.waitFor = waitFor;
  global.by = by;
};

export {
  exportGlobals,
  expect,
  waitFor,
  element,
  by
};
