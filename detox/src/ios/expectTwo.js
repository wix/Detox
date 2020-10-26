const _ = require('lodash');
const DetoxRuntimeError = require('../errors/DetoxRuntimeError');
const { assertEnum, assertNormalized, assertNumber } = require('../utils/assertArgument');
const assertDirection = assertEnum(['left', 'right', 'up', 'down']);
const assertSpeed = assertEnum(['fast', 'slow']);

class Expect {
  constructor(invocationManager, element) {
    this._invocationManager = invocationManager;
    this.element = element;
    this.modifiers = [];
  }

  toBeVisible() {
    return this.expect('toBeVisible');
  }

  toBeNotVisible() {
    return this.not.toBeVisible();
  }

  toExist() {
    return this.expect('toExist');
  }

  toNotExist() {
    return this.not.toExist();
  }

  toHaveText(text) {
    return this.expect('toHaveText', text);
  }

  toNotHaveText(text) {
    return this.not.toHaveText(text);
  }

  toHaveLabel(label) {
    return this.expect('toHaveLabel', label);
  }

  toNotHaveLabel(label) {
    return this.not.toHaveLabel(label);
  }

  toHaveId(id) {
    return this.expect('toHaveId', id);
  }

  toNotHaveId(id) {
    return this.not.toHaveId(id);
  }

  toHaveValue(value) {
    return this.expect('toHaveValue', value);
  }

  toNotHaveValue(value) {
    return this.not.toHaveValue(value);
  }

  toHaveSliderPosition(position, tolerance = 0) {
    return this.expect('toHaveSliderPosition', position, tolerance);
  }

  toHaveToggleValue(value) {
    return this.toHaveValue(`${Number(value)}`);
  }

  get not() {
    this.modifiers.push('not');
    return this;
  }

  createInvocation(expectation, ...params) {
    return {
      type: 'expectation',
      predicate: this.element.matcher.predicate,
      ...(this.element.index !== undefined && { atIndex: this.element.index }),
      ...(this.modifiers.length !== 0 && {modifiers: this.modifiers}),
      expectation,
      ...(params.length !== 0 && { params: _.without(params, undefined) })
    };
  }

  expect(expectation, ...params) {
    const invocation = this.createInvocation(expectation, ...params);
    return this._invocationManager.execute(invocation);
  }
}

class InternalExpect extends Expect {
  expect(expectation, ...params) {
    const invocation = this.createInvocation(expectation, ...params);
    return invocation;
  }
}

class Element {
  constructor(invocationManager, matcher) {
    this._invocationManager = invocationManager;
    this.matcher = matcher;
  }

  atIndex(index) {
    if (typeof index !== 'number') throw new Error(`atIndex argument must be a number, got ${typeof index}`);
    this.index = index;
    return this;
  }

  getAttributes() {
    return this.withAction('getAttributes');
  }

  tap(point) {
    if (point) {
      if (typeof point !== 'object') throw new Error('point should be a object, but got ' + (point + (' (' + (typeof point + ')'))));
      if (typeof point.x !== 'number') throw new Error('point.x should be a number, but got ' + (point.x + (' (' + (typeof point.x + ')'))));
      if (typeof point.y !== 'number') throw new Error('point.y should be a number, but got ' + (point.y + (' (' + (typeof point.y + ')'))));
    }
    return this.withAction('tap', point);
  }

  longPress(duration = 1000) {
    if (typeof duration !== 'number') throw new Error('duration should be a number, but got ' + (duration + (' (' + (typeof duration + ')'))));
    return this.withAction('longPress', duration);
  }

  multiTap(times) {
    if (typeof times !== 'number') throw new Error('times should be a number, but got ' + (times + (' (' + (typeof times + ')'))));
    return this.withAction('multiTap', times);
  }

  tapAtPoint(point) {
    return this.tap(point);
  }

  tapBackspaceKey() {
    return this.withAction('tapBackspaceKey');
  }

  tapReturnKey() {
    return this.withAction('tapReturnKey');
  }

  typeText(text) {
    if (typeof text !== 'string') throw new Error('text should be a string, but got ' + (text + (' (' + (typeof text + ')'))));
    return this.withAction('typeText', text);
  }

  replaceText(text) {
    if (typeof text !== 'string') throw new Error('text should be a string, but got ' + (text + (' (' + (typeof text + ')'))));
    return this.withAction('replaceText', text);
  }

  clearText() {
    return this.withAction('clearText');
  }

  scroll(pixels, direction = 'down', startPositionX = NaN, startPositionY = NaN) {
    if (!['left', 'right', 'up', 'down'].some(option => option === direction)) throw new Error('direction should be one of [left, right, up, down], but got ' + direction);
    if (typeof pixels !== 'number') throw new Error('amount of pixels should be a number, but got ' + (pixels + (' (' + (typeof pixels + ')'))));
    if (typeof startPositionX !== 'number') throw new Error('startPositionX should be a number, but got ' + (startPositionX + (' (' + (typeof startPositionX + ')'))));
    if (typeof startPositionY !== 'number') throw new Error('startPositionY should be a number, but got ' + (startPositionY + (' (' + (typeof startPositionY + ')'))));
    return this.withAction('scroll', pixels, direction, startPositionX, startPositionY);
  }

  scrollTo(edge) {
    if (!['left', 'right', 'top', 'bottom'].some(option => option === edge)) throw new Error('edge should be one of [left, right, top, bottom], but got ' + edge);
    return this.withAction('scrollTo', edge);
  }

  swipe(direction, speed = 'fast', normalizedSwipeOffset = NaN, normalizedStartingPointX = NaN, normalizedStartingPointY = NaN) {
    assertDirection({ direction });
    assertSpeed({ speed });
    assertNormalized({ normalizedSwipeOffset });
    assertNormalized({ normalizedStartingPointX });
    assertNormalized({ normalizedStartingPointY });

    normalizedSwipeOffset = Number.isNaN(normalizedSwipeOffset) ? 0.75 : normalizedSwipeOffset;
    return this.withAction('swipe', direction, speed, normalizedSwipeOffset, normalizedStartingPointX, normalizedStartingPointY);
  }

  setColumnToValue(column, value) {
    if (typeof column !== 'number') throw new Error('column should be a number, but got ' + (column + (' (' + (typeof column + ')'))));
    if (typeof value !== 'string') throw new Error('value should be a string, but got ' + (value + (' (' + (typeof value + ')'))));
    return this.withAction('setColumnToValue', column, value);
  }

  setDatePickerDate(dateString, dateFormat) {
    if (typeof dateString !== 'string') throw new Error('dateString should be a string, but got ' + (dateString + (' (' + (typeof dateString + ')'))));
    if (typeof dateFormat !== 'string') throw new Error('dateFormat should be a string, but got ' + (dateFormat + (' (' + (typeof dateFormat + ')'))));
    return this.withAction('setDatePickerDate', dateString, dateFormat);
  }

  pinch(scale, speed = 'fast', angle = 0) {
    if (typeof scale !== 'number' || !Number.isFinite(scale) || scale < 0) throw new Error(`pinch scale must be a finite number larger than zero`);
    if (!['slow', 'fast'].includes(speed)) throw new Error(`pinch speed is either 'slow' or 'fast'`);
    if (typeof angle !== 'number' || !Number.isFinite(angle)) throw new Error(`pinch angle must be a finite number (radian)`);
    return this.withAction('pinch', scale, speed, angle);
  }

  pinchWithAngle(direction, speed = 'slow', angle = 0) {
    if (!['inward', 'outward'].includes(direction)) throw new Error(`pinchWithAngle direction is either 'inward' or 'outward'`);
    if (!['slow', 'fast'].includes(speed)) throw new Error(`pinchWithAngle speed is either 'slow' or 'fast'`);
    if (typeof angle !== 'number') throw new Error(`pinchWithAngle angle must be a number (radiant), got ${typeof angle}`);
    return this.withAction('pinchWithAngle', direction, speed, angle);
  }

  adjustSliderToPosition(position) {
    if (!(typeof position === 'number' && position >= 0 && position <= 1)) throw new Error('position should be a number [0.0, 1.0], but got ' + (position + (' (' + (typeof position + ')'))));
    return this.withAction('adjustSliderToPosition', position);
  }

  takeScreenshot() {
    throw new DetoxRuntimeError({message: 'Element screenshots are not supported on iOS, at the moment!'});
  }

  createInvocation(action, ...params) {
    params = _.map(params, (param) => _.isNaN(param) ? null : param);
    return ({
      type: 'action',
      action,
      ...(this.index !== undefined && { atIndex: this.index }),
      ...(_.without(params, undefined).length !== 0 && { params: _.without(params, undefined) }),
      predicate: this.matcher.predicate
    });
  }

  withAction(action, ...params) {
    const invocation = this.createInvocation(action, ...params);
    return this._invocationManager.execute(invocation);
  }
}

class InternalElement extends Element {

  withAction(action, ...params) {
    const invocation = this.createInvocation(action, ...params);
    return invocation;
  }
}

class By {
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

  accessibilityLabel(label) {
    return this.label(label);
  }

  label(label) {
    if (typeof label !== 'string') throw new Error('label should be a string, but got ' + (label + (' (' + (typeof label + ')'))));
    this.predicate = { type: 'label', value: label };
    return this;
  }

  id(id) {
    if (typeof id !== 'string') throw new Error('id should be a string, but got ' + (id + (' (' + (typeof id + ')'))));
    this.predicate = { type: 'id', value: id };
    return this;
  }

  type(type) {
    if (typeof type !== 'string') throw new Error('type should be a string, but got ' + (type + (' (' + (typeof type + ')'))));
    this.predicate = { type: 'type', value: type };
    return this;
  }

  traits(traits) {
    if (typeof traits !== 'object' || !traits instanceof Array) throw new Error('traits must be an array, got ' + typeof traits);
    this.predicate = { type: 'traits', value: traits };
    return this;
  }

  value(value) {
    if (typeof value !== 'string') throw new Error('value should be a string, but got ' + (value + (' (' + (typeof value + ')'))));
    this.predicate = { type: 'value', value: value };
    return this;
  }

  text(text) {
    if (typeof text !== 'string') throw new Error('text should be a string, but got ' + (text + (' (' + (typeof text + ')'))));
    this.predicate = { type: 'text', value: text };
    return this;
  }

  withAncestor(matcher) {
    if (!(matcher instanceof Matcher)) {
      throwMatcherError(matcher);
    }

    this.and({ predicate: { type: 'ancestor', predicate: matcher.predicate } });
    return this;
  }

  withDescendant(matcher) {
    if (!(matcher instanceof Matcher)) {
      throwMatcherError(matcher);
    }
    this.and({ predicate: { type: 'descendant', predicate: matcher.predicate } });
    return this;
  }

  and(matcher) {
    // if (!(matcher instanceof Matcher)) {
    //   throwMatcherError(matcher);
    // }
    const tempPredicate = this.predicate;
    delete this.predicate;
    this.predicate = { type: 'and', predicates: [] };
    this.predicate.predicates.push(tempPredicate);
    if (matcher.predicate.type === 'and') {
      this.predicate.predicates = this.predicate.predicates.concat(matcher.predicate.predicates);
    } else {
      this.predicate.predicates.push(matcher.predicate);
    }
    return this;
  }
}

class WaitFor {
  constructor(invocationManager, element) {
    this._invocationManager = invocationManager;
    this.element = new InternalElement(invocationManager, element.matcher);
    this.expectation = new InternalExpect(invocationManager, this.element);
  }

  toBeVisible() {
    this.expectation = this.expectation.toBeVisible();
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

  get not() {
    this.expectation.not;
    return this;
  }

  withTimeout(timeout) {
    if (typeof timeout !== 'number') throw new Error('text should be a number, but got ' + (timeout + (' (' + (typeof timeout + ')'))));
    if (timeout < 0) throw new Error('timeout must be larger than 0');
    this.timeout = timeout;
    return this.waitForWithTimeout();
  }

  whileElement(matcher) {
    if (!(matcher instanceof Matcher)) throwMatcherError(matcher);
    this.actionableElement = new InternalElement(this._invocationManager, matcher);
    return this;
  }

  tap(point) {
    this.action = this.actionableElement.tap(point);
    return this.waitForWithAction();
  }

  longPress(duration) {
    this.action = this.actionableElement.longPress(duration);
    return this.waitForWithAction();
  }

  multiTap(times) {
    this.action = this.actionableElement.multiTap(times);
    return this.waitForWithAction();
  }

  tapAtPoint(point) {
    this.action = this.actionableElement.tap(point);
    return this.waitForWithAction();
  }

  tapBackspaceKey() {
    this.action = this.actionableElement.tapBackspaceKey();
    return this.waitForWithAction();
  }

  tapReturnKey() {
    this.action = this.actionableElement.tapReturnKey();
    return this.waitForWithAction();
  }

  typeText(text) {
    this.action = this.actionableElement.typeText(text);
    return this.waitForWithAction();
  }

  replaceText(text) {
    this.action = this.actionableElement.replaceText(text);
    return this.waitForWithAction();
  }

  clearText() {
    this.action = this.actionableElement.clearText();
    return this.waitForWithAction();
  }

  scroll(pixels, direction, startPositionX, startPositionY) {
    this.action = this.actionableElement.scroll(pixels, direction, startPositionX, startPositionY);
    return this.waitForWithAction();
  }

  scrollTo(edge) {
    this.action = this.actionableElement.scrollTo(edge);
    return this.waitForWithAction();
  }

  swipe(direction, speed, percentage) {
    this.action = this.actionableElement.swipe(direction, speed, percentage);
    return this.waitForWithAction();
  }

  setColumnToValue(column, value) {
    this.action = this.actionableElement.setColumnToValue(column, value);
    return this.waitForWithAction();
  }

  setDatePickerDate(dateString, dateFormat) {
    this.action = this.actionableElement.setDatePickerDate(dateString, dateFormat);
    return this.waitForWithAction();
  }

  pinch(scale, speed, angle) {
    this.action = this.actionableElement.pinch(scale, speed, angle);
    return this.waitForWithAction();
  }

  pinchWithAngle(direction, speed, angle) {
    this.action = this.actionableElement.pinchWithAngle(direction, speed, angle);
    return this.waitForWithAction();
  }

  waitForWithAction() {
    const expectation = this.expectation;
    const action = this.action;

    return this._invocationManager.execute({
      ...action,
      while: {
        ...expectation
      }
    });
  }

  waitForWithTimeout() {
    const expectation = this.expectation;
    const action = this.action;
    const timeout = this.timeout;

    return this._invocationManager.execute({
      ...action,
      ...expectation,
      timeout
    });
  }
}

function element(invocationManager, matcher) {
  if (!(matcher instanceof Matcher)) {
    throwMatcherError(matcher);
  }
  return new Element(invocationManager, matcher);
}

function expect(invocationManager, element) {
  if (!(element instanceof Element)) {
    throwMatcherError(element);
  }
  return new Expect(invocationManager, element);
}

function waitFor(invocationManager, element) {
  if (!(element instanceof Element)) {
    throwMatcherError(element);
  }
  return new WaitFor(invocationManager, element);
}

class IosExpect {
  constructor({ invocationManager }) {
    this._invocationManager = invocationManager;
    this.element = this.element.bind(this);
    this.expect = this.expect.bind(this);
    this.waitFor = this.waitFor.bind(this);
    this.by = new By();
  }

  element(matcher) {
    return element(this._invocationManager, matcher);
  }

  expect(element) {
    return expect(this._invocationManager, element);
  }

  waitFor(element) {
    return waitFor(this._invocationManager, element);
  }
}

function throwMatcherError(param) {
  throw new Error(`${param} is not a Detox matcher. More about Detox matchers here: https://github.com/wix/Detox/blob/master/docs/APIRef.Matchers.md`);
}

module.exports = IosExpect;
