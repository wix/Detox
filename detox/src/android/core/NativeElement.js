const path = require('path');

const fs = require('fs-extra');
const tempfile = require('tempfile');

const DetoxRuntimeError = require('../../errors/DetoxRuntimeError');
const invoke = require('../../invoke');
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
    // if (!(matcher instanceof NativeMatcher)) throw new DetoxRuntimeError(`Element _selectElementWithMatcher argument must be a valid NativeMatcher, got ${typeof matcher}`);
    this._call = invoke.call(invoke.Espresso, 'onView', matcher._call);
  }

  atIndex(index) {
    if (typeof index !== 'number') throw new DetoxRuntimeError(`Element atIndex argument must be a number, got ${typeof index}`);
    const matcher = this._originalMatcher;
    this._originalMatcher._call = invoke.callDirectly(DetoxMatcherApi.matcherForAtIndex(index, matcher._call.value));

    this._selectElementWithMatcher(this._originalMatcher);
    return this;
  }

  async tap(value) {
    return await new ActionInteraction(this._invocationManager, this, new actions.TapAction(value)).execute();
  }

  async tapAtPoint(value) {
    return await new ActionInteraction(this._invocationManager, this, new actions.TapAtPointAction(value)).execute();
  }

  async longPress() {
    return await new ActionInteraction(this._invocationManager, this, new actions.LongPressAction()).execute();
  }

  async multiTap(times) {
    return await new ActionInteraction(this._invocationManager, this, new actions.MultiClickAction(times)).execute();
  }

  async tapBackspaceKey() {
    return await new ActionInteraction(this._invocationManager, this, new actions.PressKeyAction(67)).execute();
  }

  async tapReturnKey() {
    return await new ActionInteraction(this._invocationManager, this, new actions.TypeTextAction('\n')).execute();
  }

  async typeText(value) {
    return await new ActionInteraction(this._invocationManager, this, new actions.TypeTextAction(value)).execute();
  }

  async replaceText(value) {
    return await new ActionInteraction(this._invocationManager, this, new actions.ReplaceTextAction(value)).execute();
  }

  async clearText() {
    return await new ActionInteraction(this._invocationManager, this, new actions.ClearTextAction()).execute();
  }

  async scroll(amount, direction = 'down', startPositionX, startPositionY) {
    // override the user's element selection with an extended matcher that looks for UIScrollView children
    // this._selectElementWithMatcher(this._originalMatcher._extendToDescendantScrollViews());
    return await new ActionInteraction(this._invocationManager, this, new actions.ScrollAmountAction(direction, amount, startPositionX, startPositionY)).execute();
  }

  async scrollTo(edge) {
    // override the user's element selection with an extended matcher that looks for UIScrollView children
    this._selectElementWithMatcher(this._originalMatcher._extendToDescendantScrollViews());
    return await new ActionInteraction(this._invocationManager, this, new actions.ScrollEdgeAction(edge)).execute();
  }

  async scrollToIndex(index) {
    this._selectElementWithMatcher(this._originalMatcher._extendToDescendantScrollViews());
    return await new ActionInteraction(this._invocationManager, this, new actions.ScrollToIndex(index)).execute();
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
    return await new ActionInteraction(this._invocationManager, this, action).execute();
  }

  async takeScreenshot(screenshotName) {
    // TODO this should be moved to a lower-layer handler of this use-case
    const resultBase64 = await new ActionInteraction(this._invocationManager, this, new actions.TakeElementScreenshot()).execute();
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
    const result = await new ActionInteraction(this._invocationManager, this, new actions.GetAttributes()).execute();
    return JSON.parse(result);
  }

  async adjustSliderToPosition(newPosition) {
    return await new ActionInteraction(this._invocationManager, this, new actions.AdjustSliderToPosition(newPosition)).execute();
  }
}

module.exports = {
  NativeElement,
};
