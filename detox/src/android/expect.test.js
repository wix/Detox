describe('expect', () => {
  let e;

  let mockExecutor;
  let emitter;
  beforeEach(() => {
    jest.mock('tempfile');
    jest.mock('fs-extra');

    mockExecutor = new MockExecutor();

    const Emitter = jest.genMockFromModule('../utils/AsyncEmitter');
    emitter = new Emitter();

    const AndroidExpect = require('./expect');
    e = new AndroidExpect({
      invocationManager: mockExecutor,
      emitter,
    });
  });

  it(`element by accessibilityLabel`, async () => {
    await e.expect(e.element(e.by.accessibilityLabel('test'))).toBeVisible();
    await e.expect(e.element(e.by.accessibilityLabel('test'))).toBeNotVisible();
    await e.expect(e.element(e.by.accessibilityLabel('test'))).not.toBeVisible();
    await e.expect(e.element(e.by.accessibilityLabel('test'))).toExist();
    await e.expect(e.element(e.by.accessibilityLabel('test'))).toNotExist();
    await e.expect(e.element(e.by.accessibilityLabel('test'))).not.toExist();
    await e.expect(e.element(e.by.accessibilityLabel('test'))).toHaveText('text');
    await e.expect(e.element(e.by.accessibilityLabel('test'))).toNotHaveText('text');
    await e.expect(e.element(e.by.accessibilityLabel('test'))).not.toHaveText('text');
    await e.expect(e.element(e.by.accessibilityLabel('test'))).toHaveLabel('label');
    await e.expect(e.element(e.by.accessibilityLabel('test'))).toNotHaveLabel('label');
    await e.expect(e.element(e.by.accessibilityLabel('test'))).not.toHaveLabel('label');
    await e.expect(e.element(e.by.accessibilityLabel('test'))).toHaveId('id');
    await e.expect(e.element(e.by.accessibilityLabel('test'))).toNotHaveId('id');
    await e.expect(e.element(e.by.accessibilityLabel('test'))).not.toHaveId('id');
    await e.expect(e.element(e.by.accessibilityLabel('test'))).toHaveValue('value');
    await e.expect(e.element(e.by.accessibilityLabel('test'))).toNotHaveValue('value');
    await e.expect(e.element(e.by.accessibilityLabel('test'))).not.toHaveValue('value');
    await e.expect(e.element(e.by.accessibilityLabel('test'))).toHaveToggleValue(true);
    await e.expect(e.element(e.by.accessibilityLabel('test'))).not.toHaveToggleValue(true);
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
    await e.expect(e.element(e.by.label('test'))).toHaveToggleValue(false);
    await e.expect(e.element(e.by.label('test'))).not.toHaveToggleValue(false);
  });

  it(`element by id`, async () => {
    await e.expect(e.element(e.by.id('test'))).toBeVisible();
  });

  it(`element by type`, async () => {
    await e.expect(e.element(e.by.type('test'))).toBeVisible();
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
    await e.expect(e.element(e.by.id('test'))).not.toBeVisible();
    await e.expect(e.element(e.by.id('test').or(e.by.id('test2')))).toBeVisible();
  });

  it(`expect with wrong parameters should throw`, async () => {
    await expectToThrow(() => e.expect('notAnElement'));
    await expectToThrow(() => e.expect(e.element('notAMatcher')));
  });

  it(`matchers with wrong parameters should throw`, async () => {
    await expectToThrow(() => e.element(e.by.label(5)));
    await expectToThrow(() => e.element(e.by.accessibilityLabel(5)));
    await expectToThrow(() => e.element(e.by.id(5)));
    await expectToThrow(() => e.element(e.by.type(0)));
    await expectToThrow(() => e.by.traits(1));
    await expectToThrow(() => e.by.traits(['nonExistentTrait']));
    await expectToThrow(() => e.element(e.by.value(0)));
    await expectToThrow(() => e.element(e.by.text(0)));
    await expectToThrow(() => e.element(e.by.id('test').withAncestor('notAMatcher')));
    await expectToThrow(() => e.element(e.by.id('test').withDescendant('notAMatcher')));
    await expectToThrow(() => e.element(e.by.id('test').and('notAMatcher')));
    await expectToThrow(() => e.element(e.by.id('test').or('notAMatcher')));
  });

  it(`waitFor (element)`, async () => {
    await e.waitFor(e.element(e.by.id('id'))).toExist().withTimeout(0);
    await e.waitFor(e.element(e.by.id('id'))).not.toExist().withTimeout(0);
    await e.waitFor(e.element(e.by.id('id'))).toBeVisible();
    await e.waitFor(e.element(e.by.id('id'))).toBeNotVisible();
    await e.waitFor(e.element(e.by.id('id'))).toExist();
    await e.waitFor(e.element(e.by.id('id'))).toExist().withTimeout(0);
    await e.waitFor(e.element(e.by.id('id'))).toNotExist().withTimeout(0);

    await e.waitFor(e.element(e.by.id('id'))).toHaveText('text');
    await e.waitFor(e.element(e.by.id('id'))).toNotHaveText('value');
    await e.waitFor(e.element(e.by.id('id'))).not.toHaveText('text');

    await e.waitFor(e.element(e.by.id('id'))).toHaveLabel('text');
    await e.waitFor(e.element(e.by.id('id'))).toNotHaveLabel('text');
    await e.waitFor(e.element(e.by.id('id'))).not.toHaveLabel('text');

    await e.waitFor(e.element(e.by.id('id'))).toHaveId('id');
    await e.waitFor(e.element(e.by.id('id'))).toNotHaveId('id');
    await e.waitFor(e.element(e.by.id('id'))).not.toHaveId('id');

    await e.waitFor(e.element(e.by.id('id'))).toHaveValue('value');
    await e.waitFor(e.element(e.by.id('id'))).toNotHaveValue('value');
    await e.waitFor(e.element(e.by.id('id'))).not.toHaveValue('value');

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

  describe('element interactions', () => {
    it('should tap and long-press', async () => {
      await e.element(e.by.label('Tap Me')).tap();
      await e.element(e.by.label('Tap Me')).tap({ x: 10, y: 10 });
      await e.element(e.by.label('Tap Me')).tapAtPoint({x: 100, y: 200});
      await e.element(e.by.label('Tap Me')).longPress();
      await e.element(e.by.id('UniqueId819')).multiTap(3);
    });

    it('should not tap and long-press given bad args', async () => {
      await expectToThrow(() => e.element(e.by.id('UniqueId819')).multiTap('NaN'));
    });

    it('should press special keys', async () => {
      await e.element(e.by.id('UniqueId937')).tapBackspaceKey();
      await e.element(e.by.id('UniqueId937')).tapReturnKey();
    });

    it('should edit text', async () => {
      await e.element(e.by.id('UniqueId937')).typeText('passcode');
      await e.element(e.by.id('UniqueId005')).clearText();
      await e.element(e.by.id('UniqueId005')).replaceText('replaceTo');
    });

    it('should not edit text given bad args', async () => {
      await expectToThrow(() => e.element(e.by.id('UniqueId937')).typeText(0));
      await expectToThrow(() => e.element(e.by.id('UniqueId005')).replaceText(3));
    });

    it('should scroll', async () => {
      await e.element(e.by.id('ScrollView161')).scroll(100);
      await e.element(e.by.id('ScrollView161')).scroll(100, 'down');
      await e.element(e.by.id('ScrollView161')).scroll(100, 'up');
      await e.element(e.by.id('ScrollView161')).scroll(100, 'right');
      await e.element(e.by.id('ScrollView161')).scroll(100, 'left');
      await e.element(e.by.id('ScrollView161')).scrollTo('bottom');
      await e.element(e.by.id('ScrollView161')).scrollTo('top');
      await e.element(e.by.id('ScrollView161')).scrollTo('left');
      await e.element(e.by.id('ScrollView161')).scrollTo('right');
    });

    it('should not scroll given bad args', async () => {
      await expectToThrow(() => e.element(e.by.id('ScrollView161')).scroll('NaN', 'down'));
      await expectToThrow(() => e.element(e.by.id('ScrollView161')).scroll(100, 'noDirection'));
      await expectToThrow(() => e.element(e.by.id('ScrollView161')).scroll(100, 0));
      await expectToThrow(() => e.element(e.by.id('ScrollView161')).scrollTo(0));
      await expectToThrow(() => e.element(e.by.id('ScrollView161')).scrollTo('noDirection'));
    });

    it('should swipe', async () => {
      await e.element(e.by.id('ScrollView799')).swipe('down');
      await e.element(e.by.id('ScrollView799')).swipe('down', 'fast');
      await e.element(e.by.id('ScrollView799')).swipe('up', 'slow');
      await e.element(e.by.id('ScrollView799')).swipe('left', 'fast');
      await e.element(e.by.id('ScrollView799')).swipe('right', 'slow');
      await e.element(e.by.id('ScrollView799')).swipe('down', 'fast', 0.9);
      await e.element(e.by.id('ScrollView799')).swipe('up', 'slow', 0.9);
      await e.element(e.by.id('ScrollView799')).swipe('left', 'fast', 0.9);
      await e.element(e.by.id('ScrollView799')).swipe('right', 'slow', 0.9);
      await e.element(e.by.id('ScrollView799')).swipe('down', 'fast', undefined, undefined, 0.25);
      await e.element(e.by.id('ScrollView799')).swipe('up', 'slow', 0.9, 0.5, 0.5);
    });

    it('should not swipe given bad args', async () => {
      await expectToThrow(() => e.element(e.by.id('ScrollView799')).swipe(4, 'fast'));
      await expectToThrow(() => e.element(e.by.id('ScrollView799')).swipe('noDirection', 0));
      await expectToThrow(() => e.element(e.by.id('ScrollView799')).swipe('noDirection', 'fast'));
      await expectToThrow(() => e.element(e.by.id('ScrollView799')).swipe('down', 'NotFastNorSlow'));
      await expectToThrow(() => e.element(e.by.id('ScrollView799')).swipe('down', 'NotFastNorSlow', 0.9));
    });

    it('should allow for index-based element discrepancy resolution', async () => {
      await e.element(e.by.id('ScrollView799')).atIndex(1);
    });

    it('should fail to find index-based element given invalid args', async () => {
      await expectToThrow(() => e.element(e.by.id('ScrollView799')).atIndex('NaN'));
    });
  });

  describe('element screenshots', () => {
    const tempFilePath = '/path/to/temp-file.png';
    const invokeResultInBase64 = 'VGhlcmUgaXMgbm8gc3Bvb24h';

    let tempfile;
    let fs;
    let _element;
    beforeEach(() => {
      mockExecutor.executeResult = Promise.resolve(invokeResultInBase64);

      fs = require('fs-extra');
      tempfile = require('tempfile');
      tempfile.mockReturnValue(tempFilePath);

      _element = e.element(e.by.id('FancyElement'));
    });

    it('should take and save the screenshot in a temp-file', async () => {
      await _element.takeScreenshot();
      expect(fs.writeFile).toHaveBeenCalledWith(tempFilePath, invokeResultInBase64, 'base64');
      expect(tempfile).toHaveBeenCalledWith('detox.element-screenshot.png');
    });

    it('should return the path to the temp-file containing screenshot data', async () => {
      const result = await _element.takeScreenshot();
      expect(result).toEqual(tempFilePath);
    });

    it('should emit a named-artifact creation event', async () => {
      const screenshotName = 'mock-screenshot-name';
      await _element.takeScreenshot(screenshotName);
      expect(emitter.emit).toHaveBeenCalledWith('createExternalArtifact', {
        pluginId: 'screenshot',
        artifactName: screenshotName,
        artifactPath: tempFilePath,
      });
    });

    it('should emit an artifact creation event with a default name', async () => {
      await _element.takeScreenshot(undefined);
      expect(emitter.emit).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          artifactName: 'temp-file',
        },
      ));
    });
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
  constructor() {
    this.executeResult = undefined;
  }

  async execute(invocation) {
    if (typeof invocation === 'function') {
      invocation = invocation();
    }
    expect(invocation.target).toBeDefined();
    expect(invocation.target.type).toBeDefined();
    expect(invocation.target.value).toBeDefined();

    this.recurse(invocation);
    await this.timeout(1);
    return this.executeResult ? {
      result: this.executeResult,
    } : undefined;
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
