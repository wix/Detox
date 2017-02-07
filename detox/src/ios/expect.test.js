describe('expect', () => {
  let e;

  beforeEach(() => {
    e = require('./expect');
    e.setInvocationManager(new MockExecutor());
  });

  it(`element by label`, () => {
    e.expect(e.element(e.by.label('test'))).toBeVisible();
    e.expect(e.element(e.by.label('test'))).toBeNotVisible();
    e.expect(e.element(e.by.label('test'))).toExist();
    e.expect(e.element(e.by.label('test'))).toNotExist();
    e.expect(e.element(e.by.label('test'))).toHaveText('text');
    e.expect(e.element(e.by.label('test'))).toHaveLabel('label');
    e.expect(e.element(e.by.label('test'))).toHaveId('id');
    e.expect(e.element(e.by.label('test'))).toHaveValue('value');
  });

  it(`element by id`, () => {
    e.expect(e.element(e.by.id('test'))).toBeVisible();
  });

  it(`element by type`, () => {
    e.expect(e.element(e.by.type('test'))).toBeVisible();
  });

  it(`element by traits`, () => {
    e.expect(e.element(e.by.traits(['button', 'link', 'header', 'search']))).toBeVisible();
    e.expect(e.element(e.by.traits(['image', 'selected', 'plays', 'key']))).toBeNotVisible();
    e.expect(e.element(e.by.traits(['text', 'summary', 'disabled', 'frequentUpdates']))).toBeNotVisible();
    e.expect(e.element(e.by.traits(['startsMedia', 'adjustable', 'allowsDirectInteraction', 'pageTurn']))).toBeNotVisible();
  });

  it(`matcher helpers`, () => {
    e.expect(e.element(e.by.id('test').withAncestor(e.by.id('ancestor')))).toBeVisible();
    e.expect(e.element(e.by.id('test').withDescendant(e.by.id('descendant')))).toBeVisible();
    e.expect(e.element(e.by.id('test').and(e.by.type('type')))).toBeVisible();
    e.expect(e.element(e.by.id('test').not())).toBeVisible();
  });

  it(`expect with wrong parameters should throw`, () => {
    expect(() => e.expect('notAnElement')).toThrow();
    expect(() => e.expect(e.element('notAMatcher'))).toThrow();
  });

  it(`matchers with wrong parameters should throw`, () => {
    expect(() => e.element(e.by.label(5))).toThrow();
    expect(() => e.element(e.by.id(5))).toThrow();
    expect(() => e.element(e.by.type(0))).toThrow();
    expect(() => e.by.traits(1)).toThrow();
    expect(() => e.by.traits(['nonExistentTrait'])).toThrow();
    expect(() => e.element(e.by.value(0))).toThrow();
    expect(() => e.element(e.by.text(0))).toThrow();
    expect(() => e.element(e.by.id('test').withAncestor('notAMatcher'))).toThrow();
    expect(() => e.element(e.by.id('test').withDescendant('notAMatcher'))).toThrow();
    expect(() => e.element(e.by.id('test').and('notAMatcher'))).toThrow();
  });

  it(`waitFor (element)`, () => {
    e.waitFor(e.element(e.by.id('id'))).toBeVisible();
    e.waitFor(e.element(e.by.id('id'))).toBeNotVisible();
    e.waitFor(e.element(e.by.id('id'))).toExist();
    e.waitFor(e.element(e.by.id('id'))).toExist().withTimeout(0);
    e.waitFor(e.element(e.by.id('id'))).toNotExist().withTimeout(0);
    e.waitFor(e.element(e.by.id('id'))).toHaveValue('value');
    e.waitFor(e.element(e.by.id('id'))).toNotHaveValue('value');

    e.waitFor(e.element(e.by.id('id'))).toBeVisible().whileElement(e.by.id('id2')).scroll(50, 'down');
    e.waitFor(e.element(e.by.id('id'))).toBeVisible().whileElement(e.by.id('id2')).scroll(50);
  });

  it(`waitFor (element) with wrong parameters should throw`, () => {
    expect(() => e.waitFor('notAnElement')).toThrow();
    expect(() => e.waitFor(e.element(e.by.id('id'))).toExist().withTimeout('notANumber')).toThrow();
    expect(() => e.waitFor(e.element(e.by.id('id'))).toExist().withTimeout(-1)).toThrow();
    expect(() => e.waitFor(e.element(e.by.id('id'))).toBeVisible().whileElement('notAnElement')).toThrow();
  });

  it(`waitFor (element) with non-elements should throw`, () => {
    expect(() => e.waitFor('notAnElement').toBeVisible()).toThrow();
  });

  it(`interactions`, () => {
    e.element(e.by.label('Tap Me')).tap();
    e.element(e.by.label('Tap Me')).longPress();
    e.element(e.by.id('UniqueId819')).multiTap(3);
    e.element(e.by.id('UniqueId937')).typeText('passcode');
    e.element(e.by.id('UniqueId005')).clearText();
    e.element(e.by.id('UniqueId005')).replaceText('replaceTo');
    e.element(e.by.id('ScrollView161')).scroll(100);
    e.element(e.by.id('ScrollView161')).scroll(100, 'down');
    e.element(e.by.id('ScrollView161')).scroll(100, 'up');
    e.element(e.by.id('ScrollView161')).scroll(100, 'right');
    e.element(e.by.id('ScrollView161')).scroll(100, 'left');
    e.element(e.by.id('ScrollView161')).scrollTo('bottom');
    e.element(e.by.id('ScrollView161')).scrollTo('top');
    e.element(e.by.id('ScrollView161')).scrollTo('left');
    e.element(e.by.id('ScrollView161')).scrollTo('right');
    e.element(e.by.id('ScrollView799')).swipe('down');
    e.element(e.by.id('ScrollView799')).swipe('down', 'fast');
    e.element(e.by.id('ScrollView799')).swipe('up', 'slow');
    e.element(e.by.id('ScrollView799')).swipe('left', 'fast');
    e.element(e.by.id('ScrollView799')).swipe('right', 'slow');
    e.element(e.by.id('ScrollView799')).atIndex(1);
  });

  it(`interactions with wrong parameters should throw`, () => {
    expect(() => e.element(e.by.id('UniqueId819')).multiTap('NaN')).toThrow();
    expect(() => e.element(e.by.id('UniqueId937')).typeText(0)).toThrow();
    expect(() => e.element(e.by.id('UniqueId005')).replaceText(3)).toThrow();
    expect(() => e.element(e.by.id('ScrollView161')).scroll('NaN', 'down')).toThrow();
    expect(() => e.element(e.by.id('ScrollView161')).scroll(100, 'noDirection')).toThrow();
    expect(() => e.element(e.by.id('ScrollView161')).scroll(100, 0)).toThrow();
    expect(() => e.element(e.by.id('ScrollView161')).scrollTo(0)).toThrow();
    expect(() => e.element(e.by.id('ScrollView161')).scrollTo('noDirection')).toThrow();
    expect(() => e.element(e.by.id('ScrollView799')).swipe(4, 'fast')).toThrow();
    expect(() => e.element(e.by.id('ScrollView799')).swipe('noDirection', 0)).toThrow();
    expect(() => e.element(e.by.id('ScrollView799')).swipe('noDirection', 'fast')).toThrow();
    expect(() => e.element(e.by.id('ScrollView799')).swipe('down', 'NotFastNorSlow')).toThrow();
    expect(() => e.element(e.by.id('ScrollView799')).atIndex('NaN')).toThrow();
  });

  it(`exportGlobals() should export api functions`, () => {
    const originalExpect = expect;
    e.exportGlobals();
    const newExpect = expect;
    global.expect = originalExpect;

    expect(newExpect).not.toEqual(originalExpect);
    expect(element).toBeDefined();
    expect(waitFor).toBeDefined();
    expect(by).toBeDefined();
  });
});

class MockExecutor {
  execute(invocation) {
    if (typeof invocation === 'function') {
      invocation = invocation();
    }
    expect(invocation.target).toBeDefined();
    expect(invocation.target.type).toBeDefined();
    expect(invocation.target.value).toBeDefined();

    this.recurse(invocation);
  }

  recurse(invocation) {
    for (const key in invocation) {
      if (invocation.hasOwnProperty(key)) {
        if (invocation[key] instanceof Object) {
          this.recurse(invocation[key]);
        }
        if (key === 'target' && invocation[key].type === 'Invocation') {
          const innerValue = invocation.target.value;
          expect(innerValue.target.type).toBeDefined();
          expect(innerValue.target.value).toBeDefined();
        }
      }
    }
  }
}
