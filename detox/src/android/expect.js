const invoke = require('../invoke');
const matchers = require('./matcher');
const DetoxActionApi = require('./espressoapi/DetoxAction');
const ViewActionsApi = require('./espressoapi/ViewActions');
const DetoxViewActionsApi = require('./espressoapi/DetoxViewActions');
const DetoxAssertionApi = require('./espressoapi/DetoxAssertion');
const EspressoDetoxApi = require('./espressoapi/EspressoDetox');
const DetoxMatcherApi = require('./espressoapi/DetoxMatcher');
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

const DetoxAssertion = 'com.wix.detox.espresso.DetoxAssertion';

function call(maybeAFunction) {
  return maybeAFunction instanceof Function ? maybeAFunction() : maybeAFunction;
}

class Action {}

class TapAction extends Action {
  constructor() {
    super();
    this._call = invoke.callDirectly(DetoxViewActionsApi.click());
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

class PressKeyAction extends Action {
  constructor(value) {
    super();
    this._call = invoke.callDirectly(ViewActionsApi.pressKey(value));
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
  constructor(invocationManager) {
    this.invocationManager = invocationManager;
  }

  async execute() {
    await this.invocationManager.execute(this._call);
  }
}

class ActionInteraction extends Interaction {
  constructor(element, action, invocationManager) {
    super(invocationManager);
    this._call = EspressoDetoxApi.perform(call(element._call), action._call);
    // TODO: move this.execute() here from the caller
  }
}

class MatcherAssertionInteraction extends Interaction {
  constructor(element, matcher, invocationManager) {
    super(invocationManager);
    this._call = DetoxAssertionApi.assertMatcher(call(element._call), matcher._call.value);
    // TODO: move this.execute() here from the caller
  }
}

class WaitForInteraction extends Interaction {
  constructor(element, matcher, invocationManager) {
    super(invocationManager);
    this._element = element;
    this._originalMatcher = matcher;
    // we need to override the original matcher for the element and add matcher to it as well
    this._element._selectElementWithMatcher(this._element._originalMatcher.and(this._originalMatcher));
  }

  async withTimeout(timeout) {
    if (typeof timeout !== 'number') throw new Error(`WaitForInteraction withTimeout argument must be a number, got ${typeof timeout}`);
    if (timeout < 0) throw new Error('timeout must be larger than 0');

    this._call = DetoxAssertionApi.waitForAssertMatcher(call(this._element._call), this._originalMatcher._call.value, timeout / 1000);
    await this.execute();
  }

  whileElement(searchMatcher) {
    return new WaitForActionInteraction(this._element, this._originalMatcher, searchMatcher, this.invocationManager);
  }
}

class WaitForActionInteraction extends Interaction {
  constructor(element, matcher, searchMatcher, invocationManager) {
    super(invocationManager);
    //if (!(element instanceof Element)) throw new Error(`WaitForActionInteraction ctor 1st argument must be a valid Element, got ${typeof element}`);
    //if (!(matcher instanceof Matcher)) throw new Error(`WaitForActionInteraction ctor 2nd argument must be a valid Matcher, got ${typeof matcher}`);
    if (!(searchMatcher instanceof Matcher))
      throw new Error(`WaitForActionInteraction ctor 3rd argument must be a valid Matcher, got ${typeof searchMatcher}`);
    this._element = element;
    this._originalMatcher = matcher;
    this._searchMatcher = searchMatcher;
  }
  async _execute(searchAction) {
    //if (!searchAction instanceof Action) throw new Error(`WaitForActionInteraction _execute argument must be a valid Action, got ${typeof searchAction}`);

    this._call = DetoxAssertionApi.waitForAssertMatcherWithSearchAction(
      call(this._element._call),
      call(this._originalMatcher._call).value,
      call(searchAction._call),
      call(this._searchMatcher._call).value
    );

    await this.execute();
  }
  async scroll(amount, direction = 'down') {
    await this._execute(new ScrollAmountAction(direction, amount));
  }
}

class Element {
  constructor(matcher, invocationManager) {
    this._originalMatcher = matcher;
    this.invocationManager = invocationManager;
    this._selectElementWithMatcher(this._originalMatcher);
  }
  _selectElementWithMatcher(matcher) {
    if (!(matcher instanceof Matcher))
      throw new Error(`Element _selectElementWithMatcher argument must be a valid Matcher, got ${typeof matcher}`);
    this._call = invoke.call(invoke.Espresso, 'onView', matcher._call);
  }
  atIndex(index) {
    if (typeof index !== 'number') throw new Error(`Element atIndex argument must be a number, got ${typeof index}`);
    const matcher = this._originalMatcher;
    this._originalMatcher._call = invoke.callDirectly(DetoxMatcherApi.matcherForAtIndex(index, matcher._call.value));

    this._selectElementWithMatcher(this._originalMatcher);
    return this;
  }
  async tap() {
    return await new ActionInteraction(this, new TapAction(), this.invocationManager).execute();
  }
  async tapAtPoint(value) {
    return await new ActionInteraction(this, new TapAtPointAction(value), this.invocationManager).execute();
  }
  async longPress() {
    return await new ActionInteraction(this, new LongPressAction(), this.invocationManager).execute();
  }
  async multiTap(times) {
    return await new ActionInteraction(this, new MultiClickAction(times), this.invocationManager).execute();
  }
  async tapBackspaceKey() {
    return await new ActionInteraction(this, new PressKeyAction(67), this.invocationManager).execute();
  }
  async tapReturnKey() {
    return await new ActionInteraction(this, new TypeTextAction('\n'), this.invocationManager).execute();
  }
  async typeText(value) {
    return await new ActionInteraction(this, new TypeTextAction(value), this.invocationManager).execute();
  }
  async replaceText(value) {
    return await new ActionInteraction(this, new ReplaceTextAction(value), this.invocationManager).execute();
  }
  async clearText() {
    return await new ActionInteraction(this, new ClearTextAction(), this.invocationManager).execute();
  }
  async scroll(amount, direction = 'down') {
    // override the user's element selection with an extended matcher that looks for UIScrollView children
    // this._selectElementWithMatcher(this._originalMatcher._extendToDescendantScrollViews());
    return await new ActionInteraction(this, new ScrollAmountAction(direction, amount), this.invocationManager).execute();
  }
  async scrollTo(edge) {
    // override the user's element selection with an extended matcher that looks for UIScrollView children
    this._selectElementWithMatcher(this._originalMatcher._extendToDescendantScrollViews());
    return await new ActionInteraction(this, new ScrollEdgeAction(edge), this.invocationManager).execute();
  }
  async swipe(direction, speed = 'fast', percentage = 0) {
    // override the user's element selection with an extended matcher that avoids RN issues with RCTScrollView
    this._selectElementWithMatcher(this._originalMatcher._avoidProblematicReactNativeElements());
    return await new ActionInteraction(this, new SwipeAction(direction, speed, percentage), this.invocationManager).execute();
  }
}

class Expect {
  constructor(invocationManager) {
    this.invocationManager = invocationManager;
  }
}

class ExpectElement extends Expect {
  constructor(element, invocationManager) {
    super(invocationManager);
    this._element = element;
  }
  async toBeVisible() {
    return await new MatcherAssertionInteraction(this._element, new VisibleMatcher(), this.invocationManager).execute();
  }
  async toBeNotVisible() {
    return await this.invocationManager.execute(DetoxAssertionApi.assertNotVisible(call(this._element._call)));
  }
  async toExist() {
    return await new MatcherAssertionInteraction(this._element, new ExistsMatcher(), this.invocationManager).execute();
  }
  async toNotExist() {
    return await this.invocationManager.execute(DetoxAssertionApi.assertNotExists(call(this._element._call)));
  }
  async toHaveText(value) {
    return await new MatcherAssertionInteraction(this._element, new TextMatcher(value), this.invocationManager).execute();
  }
  async toHaveLabel(value) {
    return await new MatcherAssertionInteraction(this._element, new LabelMatcher(value), this.invocationManager).execute();
  }
  async toHaveId(value) {
    return await new MatcherAssertionInteraction(this._element, new IdMatcher(value), this.invocationManager).execute();
  }
  async toHaveValue(value) {
    return await new MatcherAssertionInteraction(this._element, new ValueMatcher(value), this.invocationManager).execute();
  }
}

class WaitFor {
  constructor(invocationManager) {
    this.invocationManager = invocationManager;
  }
}

class WaitForElement extends WaitFor {
  constructor(element, invocationManager) {
    super(invocationManager);
    //if ((!element instanceof Element)) throw new Error(`WaitForElement ctor argument must be a valid Element, got ${typeof element}`);
    this._element = element;
  }
  toBeVisible() {
    return new WaitForInteraction(this._element, new VisibleMatcher(), this.invocationManager);
  }
  toBeNotVisible() {
    return new WaitForInteraction(this._element, new NotVisibleMatcher(), this.invocationManager);
  }
  toExist() {
    return new WaitForInteraction(this._element, new ExistsMatcher(), this.invocationManager);
  }
  toNotExist() {
    return new WaitForInteraction(this._element, new NotExistsMatcher(), this.invocationManager);
  }
  toHaveText(text) {
    return new WaitForInteraction(this._element, new TextMatcher(text), this.invocationManager);
  }
  toHaveValue(value) {
    return new WaitForInteraction(this._element, new ValueMatcher(value), this.invocationManager);
  }
  toNotHaveValue(value) {
    return new WaitForInteraction(this._element, new ValueMatcher(value).not(), this.invocationManager);
  }
}

class AndroidExpect {
  constructor(invocationManager) {
    this.invocationManager = invocationManager;

    this.by = {
      accessibilityLabel: value => new LabelMatcher(value),
      label: value => new LabelMatcher(value),
      id: value => new IdMatcher(value),
      type: value => new TypeMatcher(value),
      traits: value => new TraitsMatcher(value),
      value: value => new ValueMatcher(value),
      text: value => new TextMatcher(value)
    };
  }

  expect(element) {
    if (element instanceof Element) return new ExpectElement(element, this.invocationManager);
    throw new Error(`expect() argument is invalid, got ${typeof element}`);
  }

  element(matcher) {
    return new Element(matcher, this.invocationManager);
  }

  waitFor(element) {
    if (element instanceof Element) return new WaitForElement(element, this.invocationManager);
    throw new Error(`waitFor() argument is invalid, got ${typeof element}`);
  }

  exportGlobals() {
    global.element = this.element.bind(this);
    global.expect = this.expect.bind(this);
    global.waitFor = this.waitFor.bind(this);
    global.by = this.by;
  }
}

module.exports = AndroidExpect;
