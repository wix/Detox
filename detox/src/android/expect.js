const invoke = require('../invoke');
const matchers = require('./matcher');
const DetoxActionApi = require('./espressoapi/DetoxAction');
const ViewActionsApi = require('./espressoapi/ViewActions');
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

let invocationManager;

function setInvocationManager(im) {
  invocationManager = im;
}

const ViewAssertions = 'android.support.test.espresso.assertion.ViewAssertions';
const DetoxMatcher = 'com.wix.detox.espresso.DetoxMatcher';
const DetoxAssertion = 'com.wix.detox.espresso.DetoxAssertion';
const EspressoDetox = 'com.wix.detox.espresso.EspressoDetox';

class Action {}

class TapAction extends Action {
  constructor() {
    super();
    this._call = invoke.callDirectly(ViewActionsApi.click());
  }
}

class TapAtPointAction extends Action {
  constructor(value) {
    super();
    this._call = invoke.callDirectly(DetoxActionApi.tapAtLocation(value.x, value.y));
  }
}

class LongPressAction extends Action {
  constructor() {
    super();
    this._call = invoke.callDirectly(ViewActionsApi.longClick());
  }
}

class MultiClickAction extends Action {
  constructor(times) {
    super();
    this._call = invoke.callDirectly(DetoxActionApi.multiClick(times));
  }
}

class TypeTextAction extends Action {
  constructor(value) {
    super();
    this._call = invoke.callDirectly(ViewActionsApi.typeText(value));
  }
}

class ReplaceTextAction extends Action {
  constructor(value) {
    super();
    this._call = invoke.callDirectly(ViewActionsApi.replaceText(value));
  }
}

class ClearTextAction extends Action {
  constructor() {
    super();
    this._call = invoke.callDirectly(ViewActionsApi.clearText());
  }
}

class ScrollAmountAction extends Action {
  constructor(direction, amount) {
    super();
    this._call = invoke.callDirectly(DetoxActionApi.scrollInDirection(direction, amount));
  }
}

class ScrollEdgeAction extends Action {
  constructor(edge) {
    super();

    this._call = invoke.callDirectly(DetoxActionApi.scrollToEdge(edge));
  }
}

class SwipeAction extends Action {
  // This implementation ignores the percentage parameter
  constructor(direction, speed, percentage) {
    super();
    if (speed === 'fast') {
      this._call = invoke.callDirectly(DetoxActionApi.swipeInDirection(direction, true));
    } else if (speed === 'slow') {
      this._call = invoke.callDirectly(DetoxActionApi.swipeInDirection(direction, false));
    } else {
      throw new Error(`SwipeAction speed must be a 'fast'/'slow', got ${speed}`);
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
    this._call = invoke.call(invoke.Android.Class(EspressoDetox), 'perform', element._call, action._call);
    // TODO: move this.execute() here from the caller
  }
}

class MatcherAssertionInteraction extends Interaction {
  constructor(element, matcher) {
    super();
    this._call = invoke.call(invoke.Android.Class(DetoxAssertion), 'assertMatcher', element._call, matcher._call);
    // TODO: move this.execute() here from the caller
  }
}

class WaitForInteraction extends Interaction {
  constructor(element, matcher) {
    super();
    this._element = element;
    this._originalMatcher = matcher;
    // we need to override the original matcher for the element and add matcher to it as well
    this._element._selectElementWithMatcher(this._element._originalMatcher.and(this._originalMatcher));
  }

  async withTimeout(timeout) {
    if (typeof timeout !== 'number') throw new Error(`WaitForInteraction withTimeout argument must be a number, got ${typeof timeout}`);
    if (timeout < 0) throw new Error('timeout must be larger than 0');

    this._call = invoke.call(invoke.Android.Class(DetoxAssertion), 'waitForAssertMatcher', this._element._call, this._originalMatcher._call, invoke.Android.Double(timeout/1000));
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
    this._call = invoke.call(invoke.Android.Class(DetoxAssertion), 'waitForAssertMatcherWithSearchAction',
      this._element._call, this._originalMatcher._call, searchAction._call, this._searchMatcher._call);
    await this.execute();
  }
  async scroll(amount, direction = 'down') {
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
    this._call = invoke.call(invoke.Espresso, 'onView', matcher._call);
  }
  atIndex(index) {
    if (typeof index !== 'number') throw new Error(`Element atIndex argument must be a number, got ${typeof index}`);
    const matcher = this._originalMatcher;
    this._originalMatcher._call = invoke.call(invoke.Android.Class(DetoxMatcher), 'matcherForAtIndex', invoke.Android.Integer(index), matcher._call);
    this._selectElementWithMatcher(this._originalMatcher);
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
  async multiTap(times) {
    return await new ActionInteraction(this, new MultiClickAction(times)).execute();
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
    // this._selectElementWithMatcher(this._originalMatcher._extendToDescendantScrollViews());
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
    return await invocationManager.execute(invoke.call(invoke.Android.Class(DetoxAssertion), 'assertNotVisible', this._element._call));
  }
  async toExist() {
    return await new MatcherAssertionInteraction(this._element, new ExistsMatcher()).execute();
  }
  async toNotExist() {
    return await invocationManager.execute(invoke.call(invoke.Android.Class(DetoxAssertion), 'assertNotExists', this._element._call));
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
    return new WaitForInteraction(this._element, new NotVisibleMatcher());
  }
  toExist() {
    return new WaitForInteraction(this._element, new ExistsMatcher());
  }
  toNotExist() {
    return new WaitForInteraction(this._element, new NotExistsMatcher());
  }
  toHaveText(text) {
    return new WaitForInteraction(this._element, new TextMatcher(text));
  }
  toHaveValue(value) {
    return new WaitForInteraction(this._element, new ValueMatcher(value));
  }
  toNotHaveValue(value) {
    return new WaitForInteraction(this._element, new ValueMatcher(value).not());
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
