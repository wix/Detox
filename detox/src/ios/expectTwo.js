// @ts-nocheck
const path = require('path');

const fs = require('fs-extra');
const _ = require('lodash');
const tempfile = require('tempfile');

const { assertTraceDescription, assertEnum, assertNormalized } = require('../utils/assertArgument');
const { removeMilliseconds } = require('../utils/dateUtils');
const { actionDescription, expectDescription } = require('../utils/invocationTraceDescriptions');
const { isRegExp } = require('../utils/isRegExp');
const log = require('../utils/logger').child({ cat: 'ws-client, ws' });
const mapLongPressArguments = require('../utils/mapLongPressArguments');
const traceInvocationCall = require('../utils/traceInvocationCall').bind(null, log);

const { systemElement, systemMatcher, systemExpect, isSystemElement } = require('./system');
const { webElement, webMatcher, webExpect, isWebElement } = require('./web');


const assertDirection = assertEnum(['left', 'right', 'up', 'down']);
const assertSpeed = assertEnum(['fast', 'slow']);

class Expect {
  constructor(invocationManager, element) {
    this._invocationManager = invocationManager;
    this.element = element;
    this.modifiers = [];
  }

  get not() {
    this.modifiers.push('not');
    return this;
  }

  toBeVisible(percent) {
    if (percent !== undefined && (!Number.isSafeInteger(percent) || percent < 1 || percent > 100)) {
      throw new Error('`percent` must be an integer between 1 and 100, but got '
        + (percent + (' (' + (typeof percent + ')'))));
    }

    const traceDescription = expectDescription.toBeVisible(percent);
    return this.expect('toBeVisible', traceDescription, percent);
  }

  toBeNotVisible() {
    return this.not.toBeVisible();
  }

  toBeFocused() {
    const traceDescription = expectDescription.toBeFocused();
    return this.expect('toBeFocused', traceDescription);
  }

  toBeNotFocused() {
    return this.not.toBeFocused();
  }

  toExist() {
    const traceDescription = expectDescription.toExist();
    return this.expect('toExist', traceDescription);
  }

  toNotExist() {
    return this.not.toExist();
  }

  toHaveText(text) {
    const traceDescription = expectDescription.toHaveText(text);
    return this.expect('toHaveText', traceDescription, text);
  }

  toNotHaveText(text) {
    return this.not.toHaveText(text);
  }

  toHaveLabel(label) {
    const traceDescription = expectDescription.toHaveLabel(label);
    return this.expect('toHaveLabel', traceDescription, label);
  }

  toNotHaveLabel(label) {
    return this.not.toHaveLabel(label);
  }

  toHaveId(id) {
    const traceDescription = expectDescription.toHaveId(id);
    return this.expect('toHaveId', traceDescription, id);
  }

  toNotHaveId(id) {
    return this.not.toHaveId(id);
  }

  toHaveValue(value) {
    const traceDescription = expectDescription.toHaveValue(value);
    return this.expect('toHaveValue', traceDescription, value);
  }

  toNotHaveValue(value) {
    return this.not.toHaveValue(value);
  }

  toHaveSliderPosition(position, tolerance = 0) {
    const traceDescription = expectDescription.toHaveSliderPosition(position, tolerance);
    return this.expect('toHaveSliderPosition', traceDescription, position, tolerance);
  }

  toHaveToggleValue(value) {
    const expectedValue = Number(value);
    const traceDescription = expectDescription.toHaveToggleValue(expectedValue);
    return this.expect('toHaveToggleValue', traceDescription, expectedValue);
  }

  createInvocation(expectation, ...params) {
    const definedParams = _.without(params, undefined);
    return {
      type: 'expectation',
      predicate: this.element.matcher.predicate,
      ...(this.element.index !== undefined && { atIndex: this.element.index }),
      ...(this.modifiers.length !== 0 && { modifiers: this.modifiers }),
      expectation,
      ...(definedParams.length !== 0 && { params: definedParams })
    };
  }

  expect(expectation, traceDescription, ...params) {
    assertTraceDescription(traceDescription);

    const invocation = this.createInvocation(expectation, ...params);
    traceDescription = expectDescription.full(traceDescription, this.modifiers.includes('not'));
    return _executeInvocation(this._invocationManager, invocation, traceDescription);
  }
}

class InternalExpect extends Expect {
  expect(expectation, _traceDescription, ...params) {
    return this.createInvocation(expectation, ...params);
  }
}

class Element {
  constructor(invocationManager, emitter, matcher, index) {
    this._invocationManager = invocationManager;
    this._emitter = emitter;
    this.matcher = matcher;
    this.index = index;
  }

  atIndex(index) {
    if (typeof index !== 'number') throw new Error(`atIndex argument must be a number, got ${typeof index}`);
    this.index = index;
    return this;
  }

  getAttributes() {
    const traceDescription = actionDescription.getAttributes();
    return this.withAction('getAttributes', traceDescription);
  }

  tap(point) {
    _assertValidPoint(point);

    const traceDescription = actionDescription.tapAtPoint(point);
    return this.withAction('tap', traceDescription, point);
  }

  longPress(arg1, arg2) {
    let { point, duration } = mapLongPressArguments(arg1, arg2);

    const traceDescription = actionDescription.longPress(point, duration);
    return this.withAction('longPress', traceDescription, point, duration);
  }

  longPressAndDrag(duration, normalizedPositionX, normalizedPositionY, targetElement,
                   normalizedTargetPositionX = NaN, normalizedTargetPositionY = NaN, speed = 'fast', holdDuration = 1000) {
    if (typeof duration !== 'number') throw new Error('duration should be a number, but got ' + (duration + (' (' + (typeof duration + ')'))));

    if (!(targetElement instanceof Element)) throwElementError(targetElement);

    if (typeof holdDuration !== 'number') throw new Error('duration should be a number, but got ' + (holdDuration + (' (' + (typeof holdDuration + ')'))));

    assertSpeed({ speed });
    assertNormalized({ normalizedPositionX });
    assertNormalized({ normalizedPositionY });
    assertNormalized({ normalizedTargetPositionX });
    assertNormalized({ normalizedTargetPositionY });

    const traceDescription = actionDescription.longPressAndDrag(duration, normalizedPositionX, normalizedPositionY, targetElement,
      normalizedTargetPositionX, normalizedTargetPositionY, speed, holdDuration);
    return this.withActionAndTargetElement('longPress', targetElement, traceDescription, duration, normalizedPositionX, normalizedPositionY,
      normalizedTargetPositionX, normalizedTargetPositionY, speed, holdDuration);
  }

  multiTap(times) {
    if (typeof times !== 'number') throw new Error('times should be a number, but got ' + (times + (' (' + (typeof times + ')'))));
    if (times < 1) throw new Error('times should be greater than 0, but got ' + times);

    const traceDescription = actionDescription.multiTap(times);
    return this.withAction('multiTap', traceDescription, times);
  }

  tapAtPoint(point) {
    return this.tap(point);
  }

  tapBackspaceKey() {
    const traceDescription = actionDescription.tapBackspaceKey();
    return this.withAction('tapBackspaceKey', traceDescription);
  }

  tapReturnKey() {
    const traceDescription = actionDescription.tapReturnKey();
    return this.withAction('tapReturnKey', traceDescription);
  }

  typeText(text) {
    if (typeof text !== 'string') throw new Error('text should be a string, but got ' + (text + (' (' + (typeof text + ')'))));

    const traceDescription = actionDescription.typeText(text);
    return this.withAction('typeText', traceDescription, text);
  }

  replaceText(text) {
    if (typeof text !== 'string') throw new Error('text should be a string, but got ' + (text + (' (' + (typeof text + ')'))));

    const traceDescription = actionDescription.replaceText(text);
    return this.withAction('replaceText', traceDescription, text);
  }

  clearText() {
    const traceDescription = actionDescription.clearText();
    return this.withAction('clearText', traceDescription);
  }

  performAccessibilityAction(actionName) {
    if (typeof actionName !== 'string') throw new Error('actionName should be a string, but got ' + (actionName + (' (' + (typeof actionName + ')'))));

    const traceDescription = actionDescription.performAccessibilityAction(actionName);
    return this.withAction('accessibilityAction', traceDescription, actionName);
  }

  scroll(pixels, direction = 'down', startPositionX = NaN, startPositionY = NaN) {
    if (!['left', 'right', 'up', 'down'].some(option => option === direction)) throw new Error('direction should be one of [left, right, up, down], but got ' + direction);
    if (typeof pixels !== 'number') throw new Error('amount of pixels should be a number, but got ' + (pixels + (' (' + (typeof pixels + ')'))));
    if (typeof startPositionX !== 'number') throw new Error('startPositionX should be a number, but got ' + (startPositionX + (' (' + (typeof startPositionX + ')'))));
    if (typeof startPositionY !== 'number') throw new Error('startPositionY should be a number, but got ' + (startPositionY + (' (' + (typeof startPositionY + ')'))));

    const traceDescription = actionDescription.scroll(pixels, direction, startPositionX, startPositionY);
    return this.withAction('scroll', traceDescription, pixels, direction, startPositionX, startPositionY);
  }

  scrollTo(edge, startPositionX = NaN, startPositionY = NaN) {
    if (!['left', 'right', 'top', 'bottom'].some(option => option === edge)) throw new Error('edge should be one of [left, right, top, bottom], but got ' + edge);
    if (typeof startPositionX !== 'number') throw new Error('startPositionX should be a number, but got ' + (startPositionX + (' (' + (typeof startPositionX + ')'))));
    if (typeof startPositionY !== 'number') throw new Error('startPositionY should be a number, but got ' + (startPositionY + (' (' + (typeof startPositionY + ')'))));

    const traceDescription = actionDescription.scrollTo(edge, startPositionX, startPositionY);
    return this.withAction('scrollTo', traceDescription, edge, startPositionX, startPositionY);
  }

  swipe(direction, speed = 'fast', normalizedSwipeOffset = NaN, normalizedStartingPointX = NaN, normalizedStartingPointY = NaN) {
    assertDirection({ direction });
    assertSpeed({ speed });
    assertNormalized({ normalizedSwipeOffset });
    assertNormalized({ normalizedStartingPointX });
    assertNormalized({ normalizedStartingPointY });

    normalizedSwipeOffset = Number.isNaN(normalizedSwipeOffset) ? 0.75 : normalizedSwipeOffset;
    const traceDescription = actionDescription.swipe(direction, speed, normalizedSwipeOffset, normalizedStartingPointX, normalizedStartingPointY);
    return this.withAction(
      'swipe',
      traceDescription,
      direction,
      speed,
      normalizedSwipeOffset,
      normalizedStartingPointX,
      normalizedStartingPointY
    );
  }

  setColumnToValue(column, value) {
    if (typeof column !== 'number') throw new Error('column should be a number, but got ' + (column + (' (' + (typeof column + ')'))));
    if (typeof value !== 'string') throw new Error('value should be a string, but got ' + (value + (' (' + (typeof value + ')'))));

    const traceDescription = actionDescription.setColumnToValue(column, value);
    return this.withAction('setColumnToValue', traceDescription, column, value);
  }

  setDatePickerDate(dateString, dateFormat) {
    if (typeof dateString !== 'string') throw new Error('dateString should be a string, but got ' + (dateString + (' (' + (typeof dateString + ')'))));
    if (typeof dateFormat !== 'string') throw new Error('dateFormat should be a string, but got ' + (dateFormat + (' (' + (typeof dateFormat + ')'))));
    if (dateFormat === 'ISO8601') {
      dateString = removeMilliseconds(dateString);
    }

    const traceDescription = actionDescription.setDatePickerDate(dateString, dateFormat);
    return this.withAction('setDatePickerDate', traceDescription, dateString, dateFormat);
  }

  pinch(scale, speed = 'fast', angle = 0) {
    if (typeof scale !== 'number' || !Number.isFinite(scale) || scale < 0) throw new Error(`pinch scale must be a finite number larger than zero`);
    if (!['slow', 'fast'].includes(speed)) throw new Error(`pinch speed is either 'slow' or 'fast'`);
    if (typeof angle !== 'number' || !Number.isFinite(angle)) throw new Error(`pinch angle must be a finite number (radian)`);

    const traceDescription = actionDescription.pinch(scale, speed, angle);
    return this.withAction('pinch', traceDescription, scale, speed, angle);
  }

  pinchWithAngle(direction, speed = 'slow', angle = 0) {
    if (!['inward', 'outward'].includes(direction)) throw new Error(`pinchWithAngle direction is either 'inward' or 'outward'`);
    if (!['slow', 'fast'].includes(speed)) throw new Error(`pinchWithAngle speed is either 'slow' or 'fast'`);
    if (typeof angle !== 'number') throw new Error(`pinchWithAngle angle must be a number (radiant), got ${typeof angle}`);

    const traceDescription = actionDescription.pinchWithAngle(direction, speed, angle);
    return this.withAction('pinchWithAngle', traceDescription, direction, speed, angle);
  }

  adjustSliderToPosition(position) {
    if (!(typeof position === 'number' && position >= 0 && position <= 1)) throw new Error('position should be a number [0.0, 1.0], but got ' + (position + (' (' + (typeof position + ')'))));

    const traceDescription = actionDescription.adjustSliderToPosition(position);
    return this.withAction('adjustSliderToPosition', traceDescription, position);
  }

  async takeScreenshot(fileName) {
    const traceDescription = actionDescription.takeScreenshot(fileName);
    const { screenshotPath } = await this.withAction('takeScreenshot', traceDescription, fileName);

    const filePath = tempfile('.detox.element-screenshot.png');
    await fs.move(screenshotPath, filePath);
    await this._emitter.emit('createExternalArtifact', {
      pluginId: 'screenshot',
      artifactName: fileName || path.basename(filePath, '.png'),
      artifactPath: filePath,
    });

    return filePath;
  }

  createInvocation(action, targetElementMatcher, ...params) {
    params = _.map(params, (param) => _.isNaN(param) ? null : param);

    const definedParams = _.without(params, undefined);
    const invocation = {
      type: 'action',
      action,
      ...(this.index !== undefined && { atIndex: this.index }),
      ...(definedParams.length !== 0 && { params: definedParams }),
      predicate: this.matcher.predicate
    };

    if (targetElementMatcher && targetElementMatcher.matcher && targetElementMatcher.matcher.predicate) {
      invocation.targetElement = {
        predicate: targetElementMatcher.matcher.predicate
      };
    }

    return invocation;
  }

  withAction(action, traceDescription, ...params) {
    const invocation = this.createInvocation(action, null, ...params);
    return _executeInvocation(this._invocationManager, invocation, traceDescription);
  }

  withActionAndTargetElement(action, targetElement, traceDescription, ...params) {
    const invocation = this.createInvocation(action, targetElement, ...params);
    return _executeInvocation(this._invocationManager, invocation, traceDescription);
  }
}

class InternalElement extends Element {
  withAction(action, _traceDescription, ...params) {
    return this.createInvocation(action, null, ...params);
  }
}

class By {
  get web() {
    return webMatcher();
  }

  get system() {
    return systemMatcher();
  }

  id(id) {
    return new Matcher().id(id);
  }

  type(type) {
    return new Matcher().type(type);
  }

  text(text) {
    return new Matcher().text(text);
  }

  label(label) {
    return new Matcher().label(label);
  }

  accessibilityLabel(label) {
    return new Matcher().accessibilityLabel(label);
  }

  traits(traits) {
    return new Matcher().traits(traits);
  }

  value(value) {
    return new Matcher().value(value);
  }
}

class Matcher {
  /** @private */
  static *predicates(matcher) {
    if (matcher.predicate.type === 'and') {
      yield* matcher.predicate.predicates;
    } else {
      yield matcher.predicate;
    }
  }

  accessibilityLabel(label) {
    return this.label(label);
  }

  label(label) {
    if (typeof label !== 'string' && !isRegExp(label)) throw new Error('label should be a string or regex, but got ' + (label + (' (' + (typeof label + ')'))));
    this.predicate = { type: 'label', value: label.toString(), isRegex: isRegExp(label) };
    return this;
  }

  id(id) {
    if (typeof id !== 'string' && !isRegExp(id)) throw new Error('id should be a string or regex, but got ' + (id + (' (' + (typeof id + ')'))));
    this.predicate = { type: 'id', value: id.toString(), isRegex: isRegExp(id) };
    return this;
  }

  type(type) {
    if (typeof type !== 'string') throw new Error('type should be a string, but got ' + (type + (' (' + (typeof type + ')'))));
    this.predicate = { type: 'type', value: type };
    return this;
  }

  traits(traits) {
    if (!Array.isArray(traits)) throw new Error('traits must be an array, got ' + typeof traits);
    this.predicate = { type: 'traits', value: traits };
    return this;
  }

  value(value) {
    if (typeof value !== 'string') throw new Error('value should be a string, but got ' + (value + (' (' + (typeof value + ')'))));
    this.predicate = { type: 'value', value: value };
    return this;
  }

  text(text) {
    if (typeof text !== 'string' && !isRegExp(text)) throw new Error(`text should be a string or regex, but got ` + (text + (' (' + (typeof text + ')'))));
    this.predicate = { type: 'text', value: text.toString(), isRegex: isRegExp(text) };
    return this;
  }

  withAncestor(matcher) {
    if (!(matcher instanceof Matcher)) {
      throwMatcherError(matcher);
    }

    return this.and({ predicate: { type: 'ancestor', predicate: matcher.predicate } });
  }

  withDescendant(matcher) {
    if (!(matcher instanceof Matcher)) {
      throwMatcherError(matcher);
    }

    return this.and({ predicate: { type: 'descendant', predicate: matcher.predicate } });
  }

  and(matcher) {
    const result = new Matcher();

    result.predicate = {
      type: 'and',
      predicates: [
        ...Matcher.predicates(this),
        ...Matcher.predicates(matcher),
      ].map(x => _.cloneDeep(x))
    };

    return result;
  }
}

class WaitFor {
  constructor(invocationManager, emitter, element) {
    this._invocationManager = invocationManager;
    this.element = new InternalElement(invocationManager, emitter, element.matcher, element.index);
    this.expectation = new InternalExpect(invocationManager, this.element);
    this._emitter = emitter;
  }

  get not() {
    this.expectation.not;
    return this;
  }

  toBeVisible(percent) {
    this.expectation = this.expectation.toBeVisible(percent);
    return this;
  }

  toBeNotVisible() {
    this.expectation = this.expectation.toBeNotVisible();
    return this;
  }

  toExist() {
    this.expectation = this.expectation.toExist();
    return this;
  }

  toNotExist() {
    this.expectation = this.expectation.toNotExist();
    return this;
  }

  toHaveText(text) {
    this.expectation = this.expectation.toHaveText(text);
    return this;
  }

  toNotHaveText(text) {
    this.expectation = this.expectation.toNotHaveText(text);
    return this;
  }

  toHaveLabel(label) {
    this.expectation = this.expectation.toHaveLabel(label);
    return this;
  }

  toNotHaveLabel(label) {
    this.expectation = this.expectation.toNotHaveLabel(label);
    return this;
  }

  toHaveId(id) {
    this.expectation = this.expectation.toHaveId(id);
    return this;
  }

  toNotHaveId(id) {
    this.expectation = this.expectation.toNotHaveId(id);
    return this;
  }

  toHaveValue(value) {
    this.expectation = this.expectation.toHaveValue(value);
    return this;
  }

  toNotHaveValue(value) {
    this.expectation = this.expectation.toNotHaveValue(value);
    return this;
  }

  toBeFocused() {
    this.expectation = this.expectation.toBeFocused();
    return this;
  }

  toBeNotFocused() {
    this.expectation = this.expectation.toBeNotFocused();
    return this;
  }

  withTimeout(timeout) {
    if (typeof timeout !== 'number') throw new Error('text should be a number, but got ' + (timeout + (' (' + (typeof timeout + ')'))));
    if (timeout < 0) throw new Error('timeout must be larger than 0');
    this.timeout = timeout;

    const traceDescription = expectDescription.withTimeout(timeout);
    return this.waitForWithTimeout(traceDescription);
  }

  whileElement(matcher) {
    if (!(matcher instanceof Matcher)) throwMatcherError(matcher);
    this.actionableElement = new InternalElement(this._invocationManager, this._emitter, matcher);
    return this;
  }

  tap(point) {
    this.action = this.actionableElement.tap(point);
    const traceDescription = actionDescription.tapAtPoint(point);
    return this.waitForWithAction(traceDescription);
  }

  longPress(arg1, arg2) {
    this.action = this.actionableElement.longPress(arg1, arg2);

    let { point, duration } = mapLongPressArguments(arg1, arg2);
    const traceDescription = actionDescription.longPress(point, duration);

    return this.waitForWithAction(traceDescription);
  }

  multiTap(times) {
    this.action = this.actionableElement.multiTap(times);
    const traceDescription = actionDescription.multiTap(times);
    return this.waitForWithAction(traceDescription);
  }

  tapAtPoint(point) {
    this.action = this.actionableElement.tap(point);
    const traceDescription = actionDescription.tapAtPoint(point);
    return this.waitForWithAction(traceDescription);
  }

  tapBackspaceKey() {
    this.action = this.actionableElement.tapBackspaceKey();
    const traceDescription = actionDescription.tapBackspaceKey();
    return this.waitForWithAction(traceDescription);
  }

  tapReturnKey() {
    this.action = this.actionableElement.tapReturnKey();
    const traceDescription = actionDescription.tapReturnKey();
    return this.waitForWithAction(traceDescription);
  }

  typeText(text) {
    this.action = this.actionableElement.typeText(text);
    const traceDescription = actionDescription.typeText(text);
    return this.waitForWithAction(traceDescription);
  }

  replaceText(text) {
    this.action = this.actionableElement.replaceText(text);
    const traceDescription = actionDescription.replaceText(text);
    return this.waitForWithAction(traceDescription);
  }

  clearText() {
    this.action = this.actionableElement.clearText();
    const traceDescription = actionDescription.clearText();
    return this.waitForWithAction(traceDescription);
  }

  scroll(pixels, direction, startPositionX, startPositionY) {
    this.action = this.actionableElement.scroll(pixels, direction, startPositionX, startPositionY);

    const traceDescription = actionDescription.scroll(pixels, direction, startPositionX, startPositionY);
    return this.waitForWithAction(traceDescription);
  }

  scrollTo(edge) {
    this.action = this.actionableElement.scrollTo(edge);
    const traceDescription = actionDescription.scrollTo(edge);
    return this.waitForWithAction(traceDescription);
  }

  swipe(direction, speed, percentage) {
    this.action = this.actionableElement.swipe(direction, speed, percentage);
    const traceDescription = actionDescription.swipe(direction, speed, percentage);
    return this.waitForWithAction(traceDescription);
  }

  setColumnToValue(column, value) {
    this.action = this.actionableElement.setColumnToValue(column, value);
    const traceDescription = actionDescription.setColumnToValue(column, value);
    return this.waitForWithAction(traceDescription);
  }

  setDatePickerDate(dateString, dateFormat) {
    this.action = this.actionableElement.setDatePickerDate(dateString, dateFormat);
    const traceDescription = actionDescription.setDatePickerDate(dateString, dateFormat);
    return this.waitForWithAction(traceDescription);
  }

  performAccessibilityAction(actionName) {
    this.action = this.actionableElement.performAccessibilityAction(actionName);
    const traceDescription = actionDescription.performAccessibilityAction(actionName);
    return this.waitForWithAction(traceDescription);
  }

  pinch(scale, speed, angle) {
    this.action = this.actionableElement.pinch(scale, speed, angle);
    const traceDescription = actionDescription.pinch(scale, speed, angle);
    return this.waitForWithAction(traceDescription);
  }

  pinchWithAngle(direction, speed, angle) {
    this.action = this.actionableElement.pinchWithAngle(direction, speed, angle);
    const traceDescription = actionDescription.pinchWithAngle(direction, speed, angle);
    return this.waitForWithAction(traceDescription);
  }

  waitForWithAction(actionTraceDescription) {
    const expectation = this.expectation;
    const action = this.action;

    const invocation = this.createWaitForWithActionInvocation(expectation, action);

    const traceDescription = expectDescription.waitFor(actionTraceDescription);
    return _executeInvocation(this._invocationManager, invocation, traceDescription);
  }

  createWaitForWithActionInvocation(expectation, action) {
    return {
      ...action,
      while: {
        ...expectation
      }
    };
  }

  waitForWithTimeout(expectTraceDescription) {
    const expectation = this.expectation;
    const action = this.action;
    const timeout = this.timeout;

    const invocation = this.createWaitForWithTimeoutInvocation(expectation, action, timeout);

    const traceDescription = expectDescription.waitForWithTimeout(expectTraceDescription, timeout);
    return _executeInvocation(this._invocationManager, invocation, traceDescription);
  }

  createWaitForWithTimeoutInvocation(expectation, action, timeout) {
    return {
      ...action,
      ...expectation,
      timeout
    };
  }
}

function element(invocationManager, emitter, matcher) {
  if (!(matcher instanceof Matcher)) {
    throwMatcherError(matcher);
  }

  return new Element(invocationManager, emitter, matcher);
}

function expect(invocationManager, element) {
  if (!(element instanceof Element)) {
    throwMatcherError(element);
  }

  return new Expect(invocationManager, element);
}

function waitFor(invocationManager, emitter, element) {
  if (!(element instanceof Element)) {
    throwMatcherError(element);
  }
  return new WaitFor(invocationManager, emitter, element);
}

class IosExpect {
  constructor({ invocationManager, xcuitestRunner, emitter }) {
    this._invocationManager = invocationManager;
    this._xcuitestRunner = xcuitestRunner;
    this._emitter = emitter;
    this.element = this.element.bind(this);
    this.expect = this.expect.bind(this);
    this.waitFor = this.waitFor.bind(this);
    this.by = new By();
    this.web = this.web.bind(this);
    this.web.element = this.web().element;
    this.system = this.system.bind(this);
    this.system.element = this.system().element;
  }

  element(matcher) {
    return element(this._invocationManager, this._emitter, matcher);
  }

  expect(element) {
    if (isSystemElement(element)) {
      return systemExpect(this._xcuitestRunner, element);
    }

    if (isWebElement(element)) {
      return webExpect(this._invocationManager, this._xcuitestRunner, element);
    }

    return expect(this._invocationManager, element);
  }

  waitFor(element) {
    return waitFor(this._invocationManager, this._emitter, element);
  }

  web(matcher) {
    return {
      atIndex: index => {
        if (typeof index !== 'number' || index < 0) throw new Error('index should be an integer, got ' + (index + (' (' + (typeof index + ')'))));
        if (!(matcher instanceof Matcher)) throw new Error('cannot apply atIndex to a non-matcher');
        matcher.index = index;
        return this.web(matcher);
      },
      element: webMatcher => {
        if (!(matcher instanceof Matcher) && matcher !== undefined) {
          throwMatcherError(matcher);
        }

        const webViewElement = matcher ? element(this._invocationManager, this._emitter, matcher) : undefined;
        return webElement(this._invocationManager, this._xcuitestRunner, this._emitter, webViewElement, webMatcher);
      }
    };
  }

  system() {
    return {
      element: systemMatcher => {
        return systemElement(this._xcuitestRunner, systemMatcher);
      }
    };
  }
}

function _assertValidPoint(point) {
  if (!point) {
    // point is optional
    return;
  }

  if (typeof point !== 'object') throw new Error('point should be a object, but got ' + (point + (' (' + (typeof point + ')'))));
  if (typeof point.x !== 'number') throw new Error('point.x should be a number, but got ' + (point.x + (' (' + (typeof point.x + ')'))));
  if (typeof point.y !== 'number') throw new Error('point.y should be a number, but got ' + (point.y + (' (' + (typeof point.y + ')'))));
}

function throwMatcherError(param) {
  throw new Error(`${param} is not a Detox matcher. More about Detox matchers here: https://wix.github.io/Detox/docs/api/matchers`);
}

function throwElementError(param) {
  throw new Error(`${param} is not a Detox element. More about Detox elements here: https://wix.github.io/Detox/docs/api/matchers`);
}

function _executeInvocation(invocationManager, invocation, traceDescription) {
  return traceInvocationCall(traceDescription, invocation, invocationManager.execute(invocation));
}

module.exports = IosExpect;
