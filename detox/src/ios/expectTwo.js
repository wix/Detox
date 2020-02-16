class Expect {
  constructor(element) {
    this.element = element;
  }

  toBeVisible() {
    return this.expect('toBeVisible');
  }

  toBeNotVisible() {
    return this.expect('toBeNotVisible');
  }

  toExist() {
    return this.expect('toExist');
  }

  toNotExist() {
    return this.expect('toNotExist');
  }

  toHaveText(text) {
    return this.expect('toHaveText', text);
  }

  toHaveLabel(label) {
    return this.expect('toHaveLabel', label);
  }

  toHaveId(id) {
    return this.expect('toHaveId', id);
  }

  toHaveValue(value) {
    return this.expect('toHaveValue', value);
  }

  toNotHaveValue(value) {
    return this.expect('toNotHaveValue', value);
  }

  expect(expectation, ...params) {
    return _invocationManager.execute({
      type: 'expectation',
      predicate: this.element.matcher.predicate,
      expectation,
      ...(params.length !== 0 && { params })
    });
  }
}

class Element {
  constructor(matcher) {
    this.matcher = matcher;
  }

  atIndex(index) {
    if (typeof index !== 'number') throw new Error(`atIndex argument must be a number, got ${typeof index}`);
    this.index = index;
    return this;
  }

  tap() {
    return this.withAction('tap');
  }

  longPress(duration) {
    return this.withAction('longPress', duration);
  }

  multiTap(times) {
    if (typeof times !== 'number') throw new Error('times should be a number, but got ' + (times + (' (' + (typeof times + ')'))));
    return this.withAction('multiTap', times);
  }

  tapAtPoint(point) {
    return this.withAction('tapAtPoint', point);
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

  swipe(direction, speed = 'fast', percentage = 0) {
    if (!['left', 'right', 'up', 'down'].some(option => option === direction)) throw new Error('direction should be one of [left, right, up, down], but got ' + direction);
    if (!['slow', 'fast'].some(option => option === speed)) throw new Error('speed should be one of [slow, fast], but got ' + speed);
    if (!(typeof percentage === 'number' && percentage >= 0 && percentage <= 1)) throw new Error('yOriginStartPercentage should be a number [0.0, 1.0], but got ' + (percentage + (' (' + (typeof percentage + ')'))));
    return this.withAction('swipe', direction, speed, percentage);
  }

  setColumnToValue(column, value) {
    return this.withAction('setColumnToValue', column, value);
  }

  setDatePickerDate(dateString, dateFormat) {
    return this.withAction('setColumnToValue', dateString, dateFormat);
  }

  pinchWithAngle(direction, speed = 'slow', angle = 0) {
    if (!['inward', 'outward'].includes(direction)) throw new Error(`pinchWithAngle direction is either 'inward' or 'outward'`);
    if (!['slow', 'fast'].includes(speed)) throw new Error(`pinchWithAngle speed is either 'slow' or 'fast'`);
    if (typeof angle !== 'number') throw new Error(`pinchWithAngle angle must be a number (radiant), got ${typeof angle}`);
    return this.withAction('pinchWithAngle', direction, speed, angle);
  }

  withAction(action, ...params) {

    params = params.filter(function(el) {
      return el != null;
    });

    return _invocationManager.execute({
      type: 'action',
      action,
      ...(this.index && { atIndex: this.index }),
      ...(params.length !== 0 && { params }),
      predicate: this.matcher.predicate
    });
  }
}

class By {
  id(byId) {
    return new Matcher().id(byId);
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
}

class Matcher {

  accessibilityLabel(byLabel) {
    return this.label(byLabel);
  }

  label(byLabel) {
    console.log(byLabel);
    if (typeof byLabel !== 'string') throw new Error('label should be a string, but got ' + (byLabel + (' (' + (typeof byLabel + ')'))));
    this.predicate = { type: 'label', value: byLabel };
    return this;
  }

  id(byId) {
    if (typeof byId !== 'string') throw new Error('id should be a string, but got ' + (byId + (' (' + (typeof byId + ')'))));
    this.predicate = { type: 'id', value: byId };
    return this;
  }

  //TODO - no type matcher!!

  traits(byTraits) {
    if (typeof byTraits !== 'object' || !byTraits instanceof Array) throw new Error('traits must be an array, got ' + typeof byTraits);
    this.predicate = { type: 'traits', value: byTraits };
    return this;
  }

  value(byValue) {
    if (typeof byValue !== 'string') throw new Error('value should be a string, but got ' + (byValue + (' (' + (typeof byValue + ')'))));
    this.predicate = { type: 'value', value: byValue };
    return this;
  }

  text(byText) {
    if (typeof byText !== 'string') throw new Error('text should be a string, but got ' + (byText + (' (' + (typeof byText + ')'))));
    this.predicate = { type: 'text', value: byText };
    return this;
  }

  withAncestor(matcher) {
    if (!(matcher instanceof Matcher)) {
      throwMatcherError(matcher);
    }

    this.and({ predicate: { type: 'ancestor', value: matcher.predicate } });
    return this;
  }

  withDescendant(matcher) {
    if (!(matcher instanceof Matcher)) {
      throwMatcherError(matcher);
    }
    this.and({ predicate: { type: 'descendant', value: matcher.predicate } });
    return this;
  }

  and(matcher) {
    // if (!(matcher instanceof Matcher)) {
    //   throwMatcherError(matcher);
    // }
    console.log(this.predicate);
    if (this.predicate.type === 'and') {
      this.predicate.predicates.push(matcher);
      console.log(this.predicate);
    } else {
      this.predicate = { type: 'and', predicates: [this.predicate, matcher.predicate] };
      console.log(this.predicate);
    }
    console.log(this.predicate.type);
    return this;
  }
}

class WaitFor {
  constructor(element) {
    this.element = element;
  }

  toBeVisible() {
    this.expectation = expect(this.element).toBeVisible();
    return this;
  }

  toBeNotVisible() {
    this.expectation = expect(this.element).toBeNotVisible();
    return this;
  }

  toExist() {
    this.expectation = expect(this.element).toExist();
    return this;
  }

  toNotExist() {
    this.expectation = expect(this.element).toNotExist();
    return this;
  }

  toHaveText(text) {
    this.expectation = expect(this.element).toHaveText(text);
    return this;
  }

  toHaveLabel(label) {
    this.expectation = expect(this.element).toHaveLabel(label);
    return this;
  }

  toHaveId(id) {
    this.expectation = expect(this.element).toHaveId(id);
    return this;
  }

  toHaveValue(value) {
    this.expectation = expect(this.element).toHaveValue(value);
    return this;
  }

  toNotHaveValue(value) {
    this.expectation = expect(this.element).toNotHaveValue(value);
    return this;
  }

  withTimeout(timeout) {

    if (typeof timeout !== 'number') throw new Error('text should be a number, but got ' + (timeout + (' (' + (typeof timeout + ')'))));
    if (timeout < 0) throw new Error('timeout must be larger than 0');
    this.timeout = timeout;
    return this.waitForWithTimeout();
  }

  whileElement(matcher) {
    this.actionableElement = element(matcher);
    return this;
  }

  tap() {
    this.action = this.actionableElement.tap();
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
    this.action = this.actionableElement.tapAtPoint(point);
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

  pinchWithAngle(direction, speed, angle) {
    this.action = this.actionableElement.pinchWithAngle(direction, speed, angle);
    return this.waitForWithAction();
  }

  waitForWithAction() {
    const expectation = this.expectation;
    const action = this.action;

    return _invocationManager.execute({
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
    expectation.type = 'waitFor';

    return _invocationManager.execute({
      ...action,
      ...expectation,
      timeout
    });
  }
}

function element(matcher) {
  if (!(matcher instanceof Matcher)) {
    throwMatcherError(matcher);
  }
  return new Element(matcher);
}

function expect(element) {
  if (!(element instanceof Element)) {
    throwMatcherError(element);
  }
  return new Expect(element);
}

function waitFor(element) {
  if (!(element instanceof Element)) {
    throwMatcherError(element);
  }
  return new WaitFor(element);
}

let _invocationManager;

class IosExpect {
  constructor(invocationManager) {
    _invocationManager = invocationManager;
    this.by = new By();
  }

  element(matcher) {
    return element(matcher);
  }

  expect(element) {
    return expect(element);
  }

  waitFor(element) {
    return waitFor(element);
  }
}

function throwMatcherError(param) {
  console.log(param);
  throw new Error(`${param} is not a Detox matcher. More about Detox matchers here: https://github.com/wix/Detox/blob/master/docs/APIRef.Matchers.md`);
}

module.exports = IosExpect;
