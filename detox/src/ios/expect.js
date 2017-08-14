const invoke = require('../invoke');
const matchers = require('./matchers');
const Matcher = matchers.Matcher;
const LabelMatcher = matchers.LabelMatcher;
const IdMatcher = matchers.IdMatcher;
const TypeMatcher = matchers.TypeMatcher;
const TraitsMatcher = matchers.TraitsMatcher;
const VisibleMatcher = matchers.VisibleMatcher;
const NotVisibleMatcher = matchers.NotVisibleMatcher;
const ExistsMatcher = matchers.ExistsMatcher;
const NotExistsMatcher = matchers.NotExistsMatcher;
const TextMatcher = matchers.TextMatcher;
const ValueMatcher = matchers.ValueMatcher;
const GreyActions = require('./earlgreyapi/GREYActions');

let invocationManager;

function setInvocationManager(im) {
  invocationManager = im;
}

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

class Action {}

class TapAction extends Action {
  constructor() {
    super();
    this._call = invoke.callDirectly(GreyActions.actionForTap());
  }
}

class TapAtPointAction extends Action {
  constructor(value) {
    super();
    this._call = invoke.callDirectly(GreyActions.actionForTapAtPoint(value));
  }
}

class LongPressAction extends Action {
  constructor() {
    super();
    this._call = invoke.callDirectly(GreyActions.actionForLongPress());
  }
}

class MultiTapAction extends Action {
  constructor(value) {
    super();
    this._call = invoke.callDirectly(GreyActions.actionForMultipleTapsWithCount(value));
  }
}

class TypeTextAction extends Action {
  constructor(value) {
    super();
    if (typeof value !== 'string') throw new Error(`TypeTextAction ctor argument must be a string, got ${typeof value}`);
    this._call = invoke.call(invoke.IOS.Class('GREYActions'), 'actionForTypeText:', value);
  }
}

class ReplaceTextAction extends Action {
  constructor(value) {
    super();
    if (typeof value !== 'string') throw new Error(`ReplaceTextAction ctor argument must be a string, got ${typeof value}`);
    this._call = invoke.call(invoke.IOS.Class('GREYActions'), 'actionForReplaceText:', value);
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

class SwipeAction extends Action {
  constructor(direction, speed, percentage) {
    super();
    if (typeof direction !== 'string') throw new Error(`SwipeAction ctor 1st argument must be a string, got ${typeof direction}`);
    if (typeof speed !== 'string') throw new Error(`SwipeAction ctor 2nd argument must be a string, got ${typeof speed}`);

    if (percentage) {
      let x, y;
      const eps = 10 ** -8;
      switch (direction) {
        case "left":
          x = percentage, y = eps;
          break;
        case "right":
          x = percentage, y = eps;
          break;
        case "up":
          y = percentage, x = eps;
          break;
        case "down":
          y = percentage, x = eps;
          break;
      }

      if (speed == 'fast') {
        this._call = invoke.callDirectly(
          GreyActions.actionForSwipeFastInDirectionXOriginStartPercentageYOriginStartPercentage(direction, x, y)
        );
      } else if (speed == 'slow') {
        this._call = invoke.callDirectly(
          GreyActions.actionForSwipeSlowInDirectionXOriginStartPercentageYOriginStartPercentage(direction, x, y)
        );
      } else {
        throw new Error(`SwipeAction speed must be a 'fast'/'slow', got ${speed}`);
      }
    } else {
      if (speed == 'fast') {
        this._call = invoke.callDirectly(GreyActions.actionForSwipeFastInDirection(direction));
      } else if (speed == 'slow') {
        this._call = invoke.callDirectly(GreyActions.actionForSwipeSlowInDirection(direction));
      } else {
        throw new Error(`SwipeAction speed must be a 'fast'/'slow', got ${speed}`);
      }
    }
  }
}

class Interaction {
  async execute() {
    //if (!this._call) throw new Error(`Interaction.execute cannot find a valid _call, got ${typeof this._call}`);
    await invocationManager.execute(this._call);
  }
}

class ActionInteraction extends Interaction {
  constructor(element, action) {
    super();
    //if (!(element instanceof Element)) throw new Error(`ActionInteraction ctor 1st argument must be a valid Element, got ${typeof element}`);
    //if (!(action instanceof Action)) throw new Error(`ActionInteraction ctor 2nd argument must be a valid Action, got ${typeof action}`);
    this._call = invoke.call(element._call, 'performAction:', action._call);
    // TODO: move this.execute() here from the caller
  }
}

class MatcherAssertionInteraction extends Interaction {
  constructor(element, matcher) {
    super();
    //if (!(element instanceof Element)) throw new Error(`MatcherAssertionInteraction ctor 1st argument must be a valid Element, got ${typeof element}`);
    //if (!(matcher instanceof Matcher)) throw new Error(`MatcherAssertionInteraction ctor 2nd argument must be a valid Matcher, got ${typeof matcher}`);
    this._call = invoke.call(element._call, 'assertWithMatcher:', matcher._call);
    // TODO: move this.execute() here from the caller
  }
}

class WaitForInteraction extends Interaction {
  constructor(element, matcher) {
    super();
    //if (!(element instanceof Element)) throw new Error(`WaitForInteraction ctor 1st argument must be a valid Element, got ${typeof element}`);
    //if (!(matcher instanceof Matcher)) throw new Error(`WaitForInteraction ctor 2nd argument must be a valid Matcher, got ${typeof matcher}`);
    this._element = element;
    this._originalMatcher = matcher;
    // we need to override the original matcher for the element and add matcher to it as well
    this._element._selectElementWithMatcher(this._element._originalMatcher.and(this._originalMatcher));
  }
  _not() {
    this._notCondition = true;
    return this;
  }
  async withTimeout(timeout) {
    if (typeof timeout !== 'number') throw new Error(`WaitForInteraction withTimeout argument must be a number, got ${typeof timeout}`);
    if (timeout < 0) throw new Error('timeout must be larger than 0');
    let _conditionCall = invoke.call(invoke.IOS.Class('GREYCondition'), 'detoxConditionForElementMatched:', this._element._call);
    if (this._notCondition) {
      _conditionCall = invoke.call(invoke.IOS.Class('GREYCondition'), 'detoxConditionForNotElementMatched:', this._element._call);
    }
    this._call = invoke.call(_conditionCall, 'waitWithTimeout:', invoke.IOS.CGFloat(timeout/1000));
    await this.execute();
  }
  whileElement(searchMatcher) {
    return new WaitForActionInteraction(this._element, this._originalMatcher, searchMatcher);
  }
}

class WaitForActionInteraction extends Interaction {
  constructor(element, matcher, searchMatcher) {
    super();
    //if (!(element instanceof Element)) throw new Error(`WaitForActionInteraction ctor 1st argument must be a valid Element, got ${typeof element}`);
    //if (!(matcher instanceof Matcher)) throw new Error(`WaitForActionInteraction ctor 2nd argument must be a valid Matcher, got ${typeof matcher}`);
    if (!(searchMatcher instanceof Matcher)) throw new Error(`WaitForActionInteraction ctor 3rd argument must be a valid Matcher, got ${typeof searchMatcher}`);
    this._element = element;
    this._originalMatcher = matcher;
    this._searchMatcher = searchMatcher;
  }
  async _execute(searchAction) {
    //if (!searchAction instanceof Action) throw new Error(`WaitForActionInteraction _execute argument must be a valid Action, got ${typeof searchAction}`);
    const _interactionCall = invoke.call(this._element._call, 'usingSearchAction:onElementWithMatcher:', searchAction._call, this._searchMatcher._call);
    this._call = invoke.call(_interactionCall, 'assertWithMatcher:', this._originalMatcher._call);
    await this.execute();
  }
  async scroll(amount, direction = 'down') {
    // override the user's element selection with an extended matcher that looks for UIScrollView children
    this._searchMatcher = this._searchMatcher._extendToDescendantScrollViews();
    await this._execute(new ScrollAmountAction(direction, amount));
  }
}

class Element {
  constructor(matcher) {
    this._originalMatcher = matcher;
    this._selectElementWithMatcher(this._originalMatcher);
  }
  _selectElementWithMatcher(matcher) {
    if (!(matcher instanceof Matcher)) throw new Error(`Element _selectElementWithMatcher argument must be a valid Matcher, got ${typeof matcher}`);
    this._call = invoke.call(invoke.EarlGrey.instance, 'detox_selectElementWithMatcher:', matcher._call);
  }
  atIndex(index) {
    if (typeof index !== 'number') throw new Error(`Element atIndex argument must be a number, got ${typeof index}`);
    const _originalCall = this._call;
    this._call = invoke.call(_originalCall, 'atIndex:', invoke.IOS.NSInteger(index));
    return this;
  }
  async tap() {
    return await new ActionInteraction(this, new TapAction()).execute();
  }
  async tapAtPoint(value) {
    return await new ActionInteraction(this, new TapAtPointAction(value)).execute();
  }
  async longPress() {
    return await new ActionInteraction(this, new LongPressAction()).execute();
  }
  async multiTap(value) {
    return await new ActionInteraction(this, new MultiTapAction(value)).execute();
  }
  async typeText(value) {
    return await new ActionInteraction(this, new TypeTextAction(value)).execute();
  }
  async replaceText(value) {
    return await new ActionInteraction(this, new ReplaceTextAction(value)).execute();
  }
  async clearText() {
    return await new ActionInteraction(this, new ClearTextAction()).execute();
  }
  async scroll(amount, direction = 'down') {
    // override the user's element selection with an extended matcher that looks for UIScrollView children
    this._selectElementWithMatcher(this._originalMatcher._extendToDescendantScrollViews());
    return await new ActionInteraction(this, new ScrollAmountAction(direction, amount)).execute();
  }
  async scrollTo(edge) {
    // override the user's element selection with an extended matcher that looks for UIScrollView children
    this._selectElementWithMatcher(this._originalMatcher._extendToDescendantScrollViews());
    return await new ActionInteraction(this, new ScrollEdgeAction(edge)).execute();
  }
  async swipe(direction, speed = 'fast', percentage = 0) {
    // override the user's element selection with an extended matcher that avoids RN issues with RCTScrollView
    this._selectElementWithMatcher(this._originalMatcher._avoidProblematicReactNativeElements());
    return await new ActionInteraction(this, new SwipeAction(direction, speed, percentage)).execute();
  }
}

class Expect {}

class ExpectElement extends Expect {
  constructor(element) {
    super();
    this._element = element;
  }
  async toBeVisible() {
    return await new MatcherAssertionInteraction(this._element, new VisibleMatcher()).execute();
  }
  async toBeNotVisible() {
    return await new MatcherAssertionInteraction(this._element, new NotVisibleMatcher()).execute();
  }
  async toExist() {
    return await new MatcherAssertionInteraction(this._element, new ExistsMatcher()).execute();
  }
  async toNotExist() {
    return await new MatcherAssertionInteraction(this._element, new NotExistsMatcher()).execute();
  }
  async toHaveText(value) {
    return await new MatcherAssertionInteraction(this._element, new TextMatcher(value)).execute();
  }
  async toHaveLabel(value) {
    return await new MatcherAssertionInteraction(this._element, new LabelMatcher(value)).execute();
  }
  async toHaveId(value) {
    return await new MatcherAssertionInteraction(this._element, new IdMatcher(value)).execute();
  }
  async toHaveValue(value) {
    return await new MatcherAssertionInteraction(this._element, new ValueMatcher(value)).execute();
  }
}

class WaitFor {}

class WaitForElement extends WaitFor {
  constructor(element) {
    super();
    //if ((!element instanceof Element)) throw new Error(`WaitForElement ctor argument must be a valid Element, got ${typeof element}`);
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
  toHaveText(text) {
    return new WaitForInteraction(this._element, new TextMatcher(text));
  }
  toHaveValue(value) {
    return new WaitForInteraction(this._element, new ValueMatcher(value));
  }
  toNotHaveValue(value) {
    return new WaitForInteraction(this._element, new ValueMatcher(value))._not();
  }
}

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
  accessibilityLabel: (value) => new LabelMatcher(value),
  label: (value) => new LabelMatcher(value),
  id: (value) => new IdMatcher(value),
  type: (value) => new TypeMatcher(value),
  traits: (value) => new TraitsMatcher(value),
  value: (value) => new ValueMatcher(value),
  text: (value) => new TextMatcher(value)
};

const exportGlobals = () => {
  global.element = element;
  global.expect = expect;
  global.waitFor = waitFor;
  global.by = by;
};

module.exports = {
  setInvocationManager,
  exportGlobals,
  expect,
  waitFor,
  element,
  by
};
