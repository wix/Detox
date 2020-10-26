const fs = require('fs-extra');
const path = require('path');
const tempfile = require('tempfile');
const invoke = require('../invoke');
const DetoxActionApi = require('./espressoapi/DetoxAction');
const ViewActionsApi = require('./espressoapi/ViewActions');
const DetoxViewActionsApi = require('./espressoapi/DetoxViewActions');
const DetoxAssertionApi = require('./espressoapi/DetoxAssertion');
const EspressoDetoxApi = require('./espressoapi/EspressoDetox');
const DetoxMatcherApi = require('./espressoapi/DetoxMatcher');
const {
  Matcher,
  LabelMatcher,
  IdMatcher,
  TypeMatcher,
  TraitsMatcher,
  VisibleMatcher,
  ExistsMatcher,
  TextMatcher,
  ValueMatcher,
  ToggleMatcher,
} = require('./matcher');
const { assertEnum, assertNormalized, assertNumber } = require('../utils/assertArgument');
const assertDirection = assertEnum(['left', 'right', 'up', 'down']);
const assertSpeed = assertEnum(['fast', 'slow']);

function call(maybeAFunction) {
  return maybeAFunction instanceof Function ? maybeAFunction() : maybeAFunction;
}

class Action {
}

class TapAction extends Action {
  constructor(value) {
    super();
    this._call = invoke.callDirectly(value ? DetoxActionApi.tapAtLocation(value.x, value.y) : DetoxViewActionsApi.click());
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
    this._call = invoke.callDirectly(DetoxViewActionsApi.typeText(value));
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
  constructor(direction, amount, startPositionX = -1.0, startPositionY = -1.0) {
    super();
    this._call = invoke.callDirectly(DetoxActionApi.scrollInDirection(direction, amount, startPositionX, startPositionY));
  }
}

class ScrollAmountStopAtEdgeAction extends Action {
  constructor(direction, amount, startPositionX = -1.0, startPositionY = -1.0) {
    super();
    this._call = invoke.callDirectly(DetoxActionApi.scrollInDirectionStaleAtEdge(direction, amount, startPositionX, startPositionY));
  }
}

class ScrollEdgeAction extends Action {
  constructor(edge) {
    super();

    this._call = invoke.callDirectly(DetoxActionApi.scrollToEdge(edge));
  }
}

class SwipeAction extends Action {
  constructor(direction, speed, normalizedSwipeOffset, normalizedStartingPointX, normalizedStartingPointY) {
    super();

    assertDirection({ direction });
    assertSpeed({ speed });
    assertNormalized({ normalizedSwipeOffset });
    assertNormalized({ normalizedStartingPointX });
    assertNormalized({ normalizedStartingPointY });

    this._call = invoke.callDirectly(
      DetoxActionApi.swipeInDirection(
        direction,
        speed === 'fast',
        normalizedSwipeOffset,
        normalizedStartingPointX,
        normalizedStartingPointY
      )
    );
  }
}

class TakeElementScreenshot extends Action {
  constructor() {
    super();
    this._call = invoke.callDirectly(DetoxActionApi.takeViewScreenshot());
  }
}

class Interaction {
  constructor(invocationManager) {
    this._call = undefined;
    this._invocationManager = invocationManager;
  }

  async execute() {
    const resultObj = await this._invocationManager.execute(this._call);
    return resultObj ? resultObj.result : undefined;
  }
}

class ActionInteraction extends Interaction {
  constructor(invocationManager, element, action) {
    super(invocationManager);
    this._call = EspressoDetoxApi.perform(call(element._call), action._call);
    // TODO: move this.execute() here from the caller
  }
}

class MatcherAssertionInteraction extends Interaction {
  constructor(invocationManager, element, matcher) {
    super(invocationManager);
    this._call = DetoxAssertionApi.assertMatcher(call(element._call), matcher._call.value);
    // TODO: move this.execute() here from the caller
  }
}

class WaitForInteraction extends Interaction {
  constructor(invocationManager, element, assertionMatcher) {
    super(invocationManager);
    this._element = element;
    this._assertionMatcher = assertionMatcher;
    this._element._selectElementWithMatcher(this._element._originalMatcher);
  }

  async withTimeout(timeout) {
    if (typeof timeout !== 'number') throw new Error(`WaitForInteraction withTimeout argument must be a number, got ${typeof timeout}`);
    if (timeout < 0) throw new Error('timeout must be larger than 0');

    this._call = DetoxAssertionApi.waitForAssertMatcher(call(this._element._call), this._assertionMatcher._call.value, timeout / 1000);
    await this.execute();
  }

  whileElement(searchMatcher) {
    return new WaitForActionInteraction(this._invocationManager, this._element, this._assertionMatcher, searchMatcher);
  }
}

class WaitForActionInteractionBase extends Interaction {
  constructor(invocationManager, element, matcher, searchMatcher) {
    super(invocationManager);
    //if (!(element instanceof Element)) throw new Error(`WaitForActionInteraction ctor 1st argument must be a valid Element, got ${typeof element}`);
    //if (!(matcher instanceof Matcher)) throw new Error(`WaitForActionInteraction ctor 2nd argument must be a valid Matcher, got ${typeof matcher}`);
    if (!(searchMatcher instanceof Matcher))
      throw new Error(`WaitForActionInteraction ctor 3rd argument must be a valid Matcher, got ${typeof searchMatcher}`);
    this._element = element;
    this._originalMatcher = matcher;
    this._searchMatcher = searchMatcher;
  }

  _prepare(searchAction) {
    //if (!searchAction instanceof Action) throw new Error(`WaitForActionInteraction _execute argument must be a valid Action, got ${typeof searchAction}`);

    this._call = DetoxAssertionApi.waitForAssertMatcherWithSearchAction(
      call(this._element._call),
      call(this._originalMatcher._call).value,
      call(searchAction._call),
      call(this._searchMatcher._call).value
    );
  }
}

class WaitForActionInteraction extends WaitForActionInteractionBase {
  async scroll(amount, direction = 'down', scrollPositionX, scrollPositionY) {
    this._prepare(new ScrollAmountStopAtEdgeAction(direction, amount, scrollPositionX, scrollPositionY));
    await this.execute();
  }
}

class Element {
  constructor(invocationManager, emitter, matcher) {
    this._invocationManager = invocationManager;
    this._emitter = emitter;
    this._originalMatcher = matcher;
    this._selectElementWithMatcher(this._originalMatcher);
  }

  _selectElementWithMatcher(matcher) {
    // if (!(matcher instanceof Matcher)) throw new Error(`Element _selectElementWithMatcher argument must be a valid Matcher, got ${typeof matcher}`);
    this._call = invoke.call(invoke.Espresso, 'onView', matcher._call);
  }

  atIndex(index) {
    if (typeof index !== 'number') throw new Error(`Element atIndex argument must be a number, got ${typeof index}`);
    const matcher = this._originalMatcher;
    this._originalMatcher._call = invoke.callDirectly(DetoxMatcherApi.matcherForAtIndex(index, matcher._call.value));

    this._selectElementWithMatcher(this._originalMatcher);
    return this;
  }

  async tap(value) {
    return await new ActionInteraction(this._invocationManager, this, new TapAction(value)).execute();
  }

  async tapAtPoint(value) {
    return await new ActionInteraction(this._invocationManager, this, new TapAtPointAction(value)).execute();
  }

  async longPress() {
    return await new ActionInteraction(this._invocationManager, this, new LongPressAction()).execute();
  }

  async multiTap(times) {
    return await new ActionInteraction(this._invocationManager, this, new MultiClickAction(times)).execute();
  }

  async tapBackspaceKey() {
    return await new ActionInteraction(this._invocationManager, this, new PressKeyAction(67)).execute();
  }

  async tapReturnKey() {
    return await new ActionInteraction(this._invocationManager, this, new TypeTextAction('\n')).execute();
  }

  async typeText(value) {
    return await new ActionInteraction(this._invocationManager, this, new TypeTextAction(value)).execute();
  }

  async replaceText(value) {
    return await new ActionInteraction(this._invocationManager, this, new ReplaceTextAction(value)).execute();
  }

  async clearText() {
    return await new ActionInteraction(this._invocationManager, this, new ClearTextAction()).execute();
  }

  async scroll(amount, direction = 'down', startPositionX, startPositionY) {
    // override the user's element selection with an extended matcher that looks for UIScrollView children
    // this._selectElementWithMatcher(this._originalMatcher._extendToDescendantScrollViews());
    return await new ActionInteraction(this._invocationManager, this, new ScrollAmountAction(direction, amount, startPositionX, startPositionY)).execute();
  }

  async scrollTo(edge) {
    // override the user's element selection with an extended matcher that looks for UIScrollView children
    this._selectElementWithMatcher(this._originalMatcher._extendToDescendantScrollViews());
    return await new ActionInteraction(this._invocationManager, this, new ScrollEdgeAction(edge)).execute();
  }

  /**
   * @param {'up' | 'right' | 'down' | 'left'} direction
   * @param {'slow' | 'fast'} [speed]
   * @param {number} [normalizedSwipeOffset] - swipe amount relative to the screen width/height
   * @param {number} [normalizedStartingPointX] - X coordinate of swipe starting point, relative to the view width
   * @param {number} [normalizedStartingPointY] - Y coordinate of swipe starting point, relative to the view height
   */
  async swipe(direction, speed = 'fast', normalizedSwipeOffset = NaN, normalizedStartingPointX = NaN, normalizedStartingPointY = NaN) {
    normalizedSwipeOffset = Number.isNaN(normalizedSwipeOffset) ? 0.75 : normalizedSwipeOffset;

    // override the user's element selection with an extended matcher that avoids RN issues with RCTScrollView
    this._selectElementWithMatcher(this._originalMatcher._avoidProblematicReactNativeElements());
    const action = new SwipeAction(direction, speed, normalizedSwipeOffset, normalizedStartingPointX, normalizedStartingPointY);
    return await new ActionInteraction(this._invocationManager, this, action).execute();
  }

  async takeScreenshot(screenshotName) {
    // TODO this should be moved to a lower-layer handler of this use-case
    const resultBase64 = await new ActionInteraction(this._invocationManager, this, new TakeElementScreenshot()).execute();
    const filePath = tempfile('detox.element-screenshot.png');
    await fs.writeFile(filePath, resultBase64, 'base64');

    await this._emitter.emit('createExternalArtifact', {
      pluginId: 'screenshot',
      artifactName: screenshotName || path.basename(filePath, '.png'),
      artifactPath: filePath,
    });
    return filePath;
  }
}

class Expect {
  constructor(invocationManager) {
    this._invocationManager = invocationManager;
  }

  get not() {
    this._notCondition = true;
    return this;
  }
}

class ExpectElement extends Expect {
  constructor(invocationManager, element) {
    super(invocationManager);
    this._element = element;
  }

  async toBeVisible() {
    return await new MatcherAssertionInteraction(this._invocationManager, this._element, this._notCondition ? new VisibleMatcher().not : new VisibleMatcher()).execute();
  }

  async toBeNotVisible() {
    return await this.not.toBeVisible();
  }

  async toExist() {
    return await new MatcherAssertionInteraction(this._invocationManager, this._element, this._notCondition ? new ExistsMatcher().not : new ExistsMatcher()).execute();
  }

  async toNotExist() {
    return await this.not.toExist();
  }

  async toHaveText(text) {
    return await new MatcherAssertionInteraction(this._invocationManager, this._element, this._notCondition ? new TextMatcher(text).not : new TextMatcher(text)).execute();
  }

  async toNotHaveText(text) {
    return await this.not.toHaveText(text);
  }

  async toHaveLabel(value) {
    return await new MatcherAssertionInteraction(this._invocationManager, this._element, this._notCondition ? new LabelMatcher(value).not : new LabelMatcher(value)).execute();
  }

  async toNotHaveLabel(value) {
    return await this.not.toHaveLabel(value);
  }

  async toHaveId(value) {
    return await new MatcherAssertionInteraction(this._invocationManager, this._element, this._notCondition ? new IdMatcher(value).not : new IdMatcher(value)).execute();
  }

  async toNotHaveId(value) {
    return await this.not.toHaveId(value);
  }

  async toHaveValue(value) {
    return await new MatcherAssertionInteraction(this._invocationManager, this._element, this._notCondition ? new ValueMatcher(value).not : new ValueMatcher(value)).execute();
  }

  async toNotHaveValue(value) {
    return await this.not.toHaveValue(value);
  }

  async toHaveToggleValue(value) {
    return await new MatcherAssertionInteraction(this._invocationManager, this._element, this._notCondition ? new ToggleMatcher(value).not : new ToggleMatcher(value)).execute()
  }
}

class WaitFor {
  constructor(invocationManager) {
    this._invocationManager = invocationManager;
  }
}

class WaitForElement extends WaitFor {
  constructor(invocationManager, element) {
    super(invocationManager);
    this._element = element;
  }

  get not() {
    this._notCondition = true;
    return this;
  }

  toBeVisible() {
    return new WaitForInteraction(this._invocationManager, this._element, this._notCondition ? new VisibleMatcher().not : new VisibleMatcher());
  }

  toBeNotVisible() {
    return this.not.toBeVisible();
  }

  toExist() {
    return new WaitForInteraction(this._invocationManager, this._element, this._notCondition ? new ExistsMatcher().not : new ExistsMatcher());
  }

  toNotExist() {
    return this.not.toExist();
  }

  toHaveText(text) {
    return new WaitForInteraction(this._invocationManager, this._element, this._notCondition ? new TextMatcher(text).not : new TextMatcher(text));
  }

  toNotHaveText(text) {
    return this.not.toHaveText(text);
  }

  toHaveLabel(value) {
    return new WaitForInteraction(this._invocationManager, this._element, this._notCondition ? new LabelMatcher(value).not : new LabelMatcher(value));
  }

  toNotHaveLabel(value) {
    return this.not.toHaveLabel(value);
  }

  toHaveId(value) {
    return new WaitForInteraction(this._invocationManager, this._element, this._notCondition ? new IdMatcher(value).not : new IdMatcher(value));
  }

  toNotHaveId(value) {
    return this.not.toHaveId(value);
  }

  toHaveValue(value) {
    return new WaitForInteraction(this._invocationManager, this._element, this._notCondition ? new ValueMatcher(value).not : new ValueMatcher(value));
  }

  toNotHaveValue(value) {
    return this.not.toHaveValue(value);
  }
}

class AndroidExpect {
  constructor({ invocationManager, emitter }) {
    this._invocationManager = invocationManager;
    this._emitter = emitter;

    this.by = {
      accessibilityLabel: value => new LabelMatcher(value),
      label: value => new LabelMatcher(value),
      id: value => new IdMatcher(value),
      type: value => new TypeMatcher(value),
      traits: value => new TraitsMatcher(value),
      value: value => new ValueMatcher(value),
      text: value => new TextMatcher(value)
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
