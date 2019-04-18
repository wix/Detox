describe('expect', () => {
  let e;

  beforeEach(() => {
    e = require('./expect');
    e.setInvocationManager(new MockExecutor());
  });

  it(`element by accessibilityLabel`, async () => {
    await e.expect(e.element(e.by.accessibilityLabel('test'))).toBeVisible();
    await e.expect(e.element(e.by.accessibilityLabel('test'))).toBeNotVisible();
    await e.expect(e.element(e.by.accessibilityLabel('test'))).toExist();
    await e.expect(e.element(e.by.accessibilityLabel('test'))).toNotExist();
    await e.expect(e.element(e.by.accessibilityLabel('test'))).toHaveText('text');
    await e.expect(e.element(e.by.accessibilityLabel('test'))).toHaveLabel('label');
    await e.expect(e.element(e.by.accessibilityLabel('test'))).toHaveId('id');
    await e.expect(e.element(e.by.accessibilityLabel('test'))).toHaveValue('value');
  });

  it(`element by label (for backwards compat)`, async () => {
    await e.expect(e.element(e.by.label('test'))).toBeVisible();
    await e.expect(e.element(e.by.label('test'))).toBeNotVisible();
    await e.expect(e.element(e.by.label('test'))).toExist();
    await e.expect(e.element(e.by.label('test'))).toNotExist();
    await e.expect(e.element(e.by.label('test'))).toHaveText('text');
    await e.expect(e.element(e.by.label('test'))).toHaveLabel('label');
    await e.expect(e.element(e.by.label('test'))).toHaveId('id');
    await e.expect(e.element(e.by.label('test'))).toHaveValue('value');
  });

  it(`element by id`, async () => {
    await e.expect(e.element(e.by.id('test'))).toBeVisible();
  });

  it(`element by type`, async () => {
    await e.expect(e.element(e.by.type('test'))).toBeVisible();
    await e.element(e.by.type('UIPickerView')).setColumnToValue(1,"6");
    await e.element(e.by.type('UIPickerView')).setDatePickerDate('2019-2-8T05:10:00-08:00', "yyyy-MM-dd'T'HH:mm:ssZZZZZ");
  });

  it(`element by traits`, async () => {
    await e.expect(e.element(e.by.traits(['button', 'link', 'header', 'search']))).toBeVisible();
    await e.expect(e.element(e.by.traits(['image', 'selected', 'plays', 'key']))).toBeNotVisible();
    await e.expect(e.element(e.by.traits(['text', 'summary', 'disabled', 'frequentUpdates']))).toBeNotVisible();
    await e.expect(e.element(e.by.traits(['startsMedia', 'adjustable', 'allowsDirectInteraction', 'pageTurn']))).toBeNotVisible();
  });

  it(`matcher helpers`, async () => {
    await e.expect(e.element(e.by.id('test').withAncestor(e.by.id('ancestor')))).toBeVisible();
    await e.expect(e.element(e.by.id('test').withDescendant(e.by.id('descendant')))).toBeVisible();
    await e.expect(e.element(e.by.id('test').and(e.by.type('type')))).toBeVisible();
    await e.expect(e.element(e.by.id('test').not())).toBeVisible();
  });

  it(`expect with wrong parameters should throw`, async () => {
     await expectToThrow(() => e.expect('notAnElement'));
     await expectToThrow(() => e.expect(e.element('notAMatcher')));
  });

  it(`matchers with wrong parameters should throw`, async () => {
    await expectToThrow(() => e.element(e.by.label(5)));
    await expectToThrow(() => e.element(e.by.id(5)));
    await expectToThrow(() => e.element(e.by.type(0)));
    await expectToThrow(() => e.by.traits(1));
    await expectToThrow(() => e.by.traits(['nonExistentTrait']));
    await expectToThrow(() => e.element(e.by.value(0)));
    await expectToThrow(() => e.element(e.by.text(0)));
    await expectToThrow(() => e.element(e.by.id('test').withAncestor('notAMatcher')));
    await expectToThrow(() => e.element(e.by.id('test').withDescendant('notAMatcher')));
    await expectToThrow(() => e.element(e.by.id('test').and('notAMatcher')));
  });

  it(`waitFor (element)`, async () => {
    await e.waitFor(e.element(e.by.id('id'))).toExist().withTimeout(0);
    await e.waitFor(e.element(e.by.id('id'))).toBeVisible();
    await e.waitFor(e.element(e.by.id('id'))).toBeNotVisible();
    await e.waitFor(e.element(e.by.id('id'))).toExist();
    await e.waitFor(e.element(e.by.id('id'))).toExist().withTimeout(0);
    await e.waitFor(e.element(e.by.id('id'))).toNotExist().withTimeout(0);
    await e.waitFor(e.element(e.by.id('id'))).toHaveText('text');
    await e.waitFor(e.element(e.by.id('id'))).toHaveValue('value');
    await e.waitFor(e.element(e.by.id('id'))).toNotHaveValue('value');



    await e.waitFor(e.element(e.by.id('id'))).toBeVisible().whileElement(e.by.id('id2')).scroll(50, 'down');
    await e.waitFor(e.element(e.by.id('id'))).toBeVisible().whileElement(e.by.id('id2')).scroll(50);
  });

  it(`waitFor (element) with wrong parameters should throw`, async () => {
     await expectToThrow(() => e.waitFor('notAnElement'));
     await expectToThrow(() => e.waitFor(e.element(e.by.id('id'))).toExist().withTimeout('notANumber'));
     await expectToThrow(() => e.waitFor(e.element(e.by.id('id'))).toExist().withTimeout(-1));
     await expectToThrow(() => e.waitFor(e.element(e.by.id('id'))).toBeVisible().whileElement('notAnElement'));
  });

  it(`waitFor (element) with non-elements should throw`, async () => {
    await expectToThrow(() => e.waitFor('notAnElement').toBeVisible());
  });

  it(`interactions`, async () => {
    await e.element(e.by.label('Tap Me')).tap();
    await e.element(e.by.label('Tap Me')).tapAtPoint({x: 10, y:10});
    await e.element(e.by.label('Tap Me')).longPress();
    await e.element(e.by.label('Tap Me')).longPress(2000);
    await e.element(e.by.id('UniqueId819')).multiTap(3);
    await e.element(e.by.id('UniqueId937')).typeText('passcode');
    await e.element(e.by.id('UniqueId937')).tapBackspaceKey();
    await e.element(e.by.id('UniqueId937')).tapReturnKey();
    await e.element(e.by.id('UniqueId005')).clearText();
    await e.element(e.by.id('UniqueId005')).replaceText('replaceTo');
    await e.element(e.by.id('UniqueId005')).pinchWithAngle('outward', 'fast', 0);
    await e.element(e.by.id('UniqueId005')).pinchWithAngle('outward');
    await e.element(e.by.id('ScrollView161')).scroll(100);
    await e.element(e.by.id('ScrollView161')).scroll(100, 'down');
    await e.element(e.by.id('ScrollView161')).scroll(100, 'up');
    await e.element(e.by.id('ScrollView161')).scroll(100, 'right');
    await e.element(e.by.id('ScrollView161')).scroll(100, 'left');
    await e.element(e.by.id('ScrollView161')).scrollTo('bottom');
    await e.element(e.by.id('ScrollView161')).scrollTo('top');
    await e.element(e.by.id('ScrollView161')).scrollTo('left');
    await e.element(e.by.id('ScrollView161')).scrollTo('right');
    await e.element(e.by.id('ScrollView799')).swipe('down');
    await e.element(e.by.id('ScrollView799')).swipe('down', 'fast');
    await e.element(e.by.id('ScrollView799')).swipe('up', 'slow');
    await e.element(e.by.id('ScrollView799')).swipe('left', 'fast');
    await e.element(e.by.id('ScrollView799')).swipe('right', 'slow');
    await e.element(e.by.id('ScrollView799')).swipe('down', 'fast', 0.9);
    await e.element(e.by.id('ScrollView799')).swipe('up', 'slow', 0.9);
    await e.element(e.by.id('ScrollView799')).swipe('left', 'fast', 0.9);
    await e.element(e.by.id('ScrollView799')).swipe('right', 'slow', 0.9);
    await e.element(e.by.id('ScrollView799')).atIndex(1);
  });

  it(`interactions with wrong parameters should throw`, async () => {
    await expectToThrow(() => e.element(e.by.id('UniqueId819')).multiTap('NaN'));
    await expectToThrow(() => e.element(e.by.id('UniqueId937')).typeText(0));
    await expectToThrow(() => e.element(e.by.id('UniqueId005')).replaceText(3));
    await expectToThrow(() => e.element(e.by.id('UniqueId005')).pinchWithAngle('noDirection', 'slow', 0));
    await expectToThrow(() => e.element(e.by.id('UniqueId005')).pinchWithAngle(1, 'slow', 0));
    await expectToThrow(() => e.element(e.by.id('UniqueId005')).pinchWithAngle('outward', 1, 0));
    await expectToThrow(() => e.element(e.by.id('UniqueId005')).pinchWithAngle('outward', 'noDirection', 0));
    await expectToThrow(() => e.element(e.by.id('UniqueId005')).pinchWithAngle('outward', 'slow', 'NaN'));
    await expectToThrow(() => e.element(e.by.id('UniqueId005')).replaceText(3));
    await expectToThrow(() => e.element(e.by.id('ScrollView161')).scroll('NaN', 'down'));
    await expectToThrow(() => e.element(e.by.id('ScrollView161')).scroll(100, 'noDirection'));
    await expectToThrow(() => e.element(e.by.id('ScrollView161')).scroll(100, 0));
    await expectToThrow(() => e.element(e.by.id('ScrollView161')).scrollTo(0));
    await expectToThrow(() => e.element(e.by.id('ScrollView161')).scrollTo('noDirection'));
    await expectToThrow(() => e.element(e.by.id('ScrollView799')).swipe(4, 'fast'));
    await expectToThrow(() => e.element(e.by.id('ScrollView799')).swipe('noDirection', 0));
    await expectToThrow(() => e.element(e.by.id('ScrollView799')).swipe('noDirection', 'fast'));
    await expectToThrow(() => e.element(e.by.id('ScrollView799')).swipe('down', 'NotFastNorSlow'));
    await expectToThrow(() => e.element(e.by.id('ScrollView799')).swipe('down', 'NotFastNorSlow', 0.9));
    await expectToThrow(() => e.element(e.by.id('ScrollView799')).atIndex('NaN'));
    await expectToThrow(() => e.element(e.by.type('UIPickerView')).setDatePickerDate(0, 'mm'));
    await expectToThrow(() => e.element(e.by.type('UIPickerView')).setDatePickerDate('something', 0));
  });

  it(`exportGlobals() should export api functions`, async () => {
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

async function expectToThrow(func) {
  try {
    await func();
  } catch (ex) {
    expect(ex).toBeDefined();
  }
}

class MockExecutor {
  async execute(invocation) {
    if (typeof invocation === 'function') {
      invocation = invocation();
    }
    expect(invocation.target).toBeDefined();
    expect(invocation.target.type).toBeDefined();
    expect(invocation.target.value).toBeDefined();

    this.recurse(invocation);
    await this.timeout(1);
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

  async timeout(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
