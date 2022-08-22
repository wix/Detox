const path = require('path');

const fs = require('fs-extra');
const tempfile = require('tempfile');

const DetoxRuntimeError = require('../../errors/DetoxRuntimeError');
const invoke = require('../../invoke');
const { actionDescription } = require('../../utils/invocationTraceDescriptions');
const actions = require('../actions/native');
const DetoxMatcherApi = require('../espressoapi/DetoxMatcher');
const { ActionInteraction } = require('../interactions/native');

class NativeElement {
  constructor(invocationManager, emitter, matcher) {
    this._invocationManager = invocationManager;
    this._emitter = emitter;
    this._originalMatcher = matcher;
    this._selectElementWithMatcher(this._originalMatcher);
  }

  _selectElementWithMatcher(matcher) {
    this._call = invoke.call(invoke.Espresso, 'onView', matcher._call);
  }

  atIndex(index) {
    if (typeof index !== 'number') throw new DetoxRuntimeError({ message: `Element atIndex argument must be a number, got ${typeof index}` });
    const matcher = this._originalMatcher;
    this._originalMatcher._call = invoke.callDirectly(DetoxMatcherApi.matcherForAtIndex(index, matcher._call.value));

    this._selectElementWithMatcher(this._originalMatcher);
    return this;
  }

  async tap(value) {
    const action = new actions.TapAction(value);
    const traceDescription = actionDescription.tapAtPoint(value);
    return await new ActionInteraction(this._invocationManager, this, action, traceDescription).execute();
  }

  async tapAtPoint(value) {
    const action = new actions.TapAtPointAction(value);
    const traceDescription = actionDescription.tapAtPoint(value);
    return await new ActionInteraction(this._invocationManager, this, action, traceDescription).execute();
  }

  async longPress() {
    const action = new actions.LongPressAction();
    const traceDescription = actionDescription.longPress();
    return await new ActionInteraction(this._invocationManager, this, action, traceDescription).execute();
  }

  async multiTap(times) {
    if (typeof times !== 'number') throw new Error('times should be a number, but got ' + (times + (' (' + (typeof times + ')'))));
    if (times < 1) throw new Error('times should be greater than 0, but got ' + times);

    const action = new actions.MultiClickAction(times);
    const traceDescription = actionDescription.multiTap(times);
    return await new ActionInteraction(this._invocationManager, this, action, traceDescription).execute();
  }

  async tapBackspaceKey() {
    const action = new actions.PressKeyAction(67);
    const traceDescription = actionDescription.tapBackspaceKey();
    return await new ActionInteraction(this._invocationManager, this, action, traceDescription).execute();
  }

  async tapReturnKey() {
    const action = new actions.TypeTextAction('\n');
    const traceDescription = actionDescription.tapReturnKey();
    return await new ActionInteraction(this._invocationManager, this, action, traceDescription).execute();
  }

  async typeText(value) {
    const action = new actions.TypeTextAction(value);
    const traceDescription = actionDescription.typeText(value);
    return await new ActionInteraction(this._invocationManager, this, action, traceDescription).execute();
  }

  async replaceText(value) {
    const action = new actions.ReplaceTextAction(value);
    const traceDescription = actionDescription.replaceText(value);
    return await new ActionInteraction(this._invocationManager, this, action, traceDescription).execute();
  }

  async clearText() {
    const action = new actions.ClearTextAction();
    const traceDescription = actionDescription.clearText();
    return await new ActionInteraction(this._invocationManager, this, action, traceDescription).execute();
  }

  async scroll(amount, direction = 'down', startPositionX, startPositionY) {
    const action = new actions.ScrollAmountAction(direction, amount, startPositionX, startPositionY);
    const traceDescription = actionDescription.scroll(amount, direction, startPositionX, startPositionY);
    return await new ActionInteraction(this._invocationManager, this, action, traceDescription).execute();
  }

  async scrollTo(edge) {
    // override the user's element selection with an extended matcher that looks for UIScrollView children
    this._selectElementWithMatcher(this._originalMatcher._extendToDescendantScrollViews());

    const action = new actions.ScrollEdgeAction(edge);
    const traceDescription = actionDescription.scrollTo(edge);
    return await new ActionInteraction(this._invocationManager, this, action, traceDescription).execute();
  }

  async scrollToIndex(index) {
    // override the user's element selection with an extended matcher that looks for UIScrollView children
    this._selectElementWithMatcher(this._originalMatcher._extendToDescendantScrollViews());

    const action = new actions.ScrollToIndex(index);
    const traceDescription = actionDescription.scrollToIndex(index);
    return await new ActionInteraction(this._invocationManager, this, action, traceDescription).execute();
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

    const action = new actions.SwipeAction(direction, speed, normalizedSwipeOffset, normalizedStartingPointX, normalizedStartingPointY);
    const traceDescription = actionDescription.swipe(direction, speed, normalizedSwipeOffset, normalizedStartingPointX, normalizedStartingPointY);
    return await new ActionInteraction(this._invocationManager, this, action, traceDescription).execute();
  }

  async takeScreenshot(screenshotName) {
    // TODO this should be moved to a lower-layer handler of this use-case
    const action = new actions.TakeElementScreenshot();
    const traceDescription = actionDescription.takeScreenshot(screenshotName);
    const resultBase64 = await new ActionInteraction(this._invocationManager, this, action, traceDescription).execute();
    const filePath = tempfile('detox.element-screenshot.png');
    await fs.writeFile(filePath, resultBase64, 'base64');

    await this._emitter.emit('createExternalArtifact', {
      pluginId: 'screenshot',
      artifactName: screenshotName || path.basename(filePath, '.png'),
      artifactPath: filePath,
    });
    return filePath;
  }

  async getAttributes() {
    const action = new actions.GetAttributes();
    const traceDescription = actionDescription.getAttributes();
    const result = await new ActionInteraction(this._invocationManager, this, action, traceDescription).execute();
    return JSON.parse(result);
  }

  async adjustSliderToPosition(newPosition) {
    const action = new actions.AdjustSliderToPosition(newPosition);
    const traceDescription = actionDescription.adjustSliderToPosition(newPosition);
    return await new ActionInteraction(this._invocationManager, this, action, traceDescription).execute();
  }
}

module.exports = {
  NativeElement,
};
