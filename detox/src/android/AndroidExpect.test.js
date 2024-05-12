// @ts-nocheck

const jestExpect = require('expect').default; // eslint-disable-line

describe('AndroidExpect', () => {
  let e;

  let mockExecutor;
  let emitter;
  let device;

  beforeEach(() => {
    jest.mock('../utils/logger');
    jest.mock('tempfile');
    jest.mock('fs-extra');

    mockExecutor = new MockExecutor();

    const Emitter = jest.genMockFromModule('../utils/AsyncEmitter');
    emitter = new Emitter();

    device = {
      _typeText: jest.fn(),
    };

    const AndroidExpect = require('./AndroidExpect');
    e = new AndroidExpect({
      invocationManager: mockExecutor,
      device,
      emitter,
    });
  });

  describe('native', () => {
    it(`element by accessibilityLabel`, async () => {
      await e.expect(e.element(e.by.accessibilityLabel('test'))).toBeVisible();
      await e.expect(e.element(e.by.accessibilityLabel('test'))).toBeVisible(35);
      await e.expect(e.element(e.by.accessibilityLabel('test'))).toBeNotVisible();
      await e.expect(e.element(e.by.accessibilityLabel('test'))).not.toBeVisible();
      await e.expect(e.element(e.by.accessibilityLabel('test'))).toExist();
      await e.expect(e.element(e.by.accessibilityLabel('test'))).toNotExist();
      await e.expect(e.element(e.by.accessibilityLabel('test'))).not.toExist();
      await e.expect(e.element(e.by.accessibilityLabel('test'))).toHaveText('text');
      await e.expect(e.element(e.by.accessibilityLabel('test'))).toNotHaveText('text');
      await e.expect(e.element(e.by.accessibilityLabel('test'))).not.toHaveText('text');
      await e.expect(e.element(e.by.accessibilityLabel('test'))).toHaveText(/text/);
      await e.expect(e.element(e.by.accessibilityLabel('test'))).toNotHaveText(/text/);
      await e.expect(e.element(e.by.accessibilityLabel('test'))).not.toHaveText(/text/);
      await e.expect(e.element(e.by.accessibilityLabel('test'))).toHaveLabel('label');
      await e.expect(e.element(e.by.accessibilityLabel('test'))).toNotHaveLabel('label');
      await e.expect(e.element(e.by.accessibilityLabel('test'))).not.toHaveLabel('label');
      await e.expect(e.element(e.by.accessibilityLabel(/test/))).toHaveLabel(/label/);
      await e.expect(e.element(e.by.accessibilityLabel(/test/))).toNotHaveLabel(/label/);
      await e.expect(e.element(e.by.accessibilityLabel(/test/))).not.toHaveLabel(/label/);
      await e.expect(e.element(e.by.accessibilityLabel('test'))).toHaveId('id');
      await e.expect(e.element(e.by.accessibilityLabel('test'))).toNotHaveId('id');
      await e.expect(e.element(e.by.accessibilityLabel('test'))).not.toHaveId('id');
      await e.expect(e.element(e.by.accessibilityLabel('test'))).toHaveId(/id/);
      await e.expect(e.element(e.by.accessibilityLabel('test'))).toNotHaveId(/id/);
      await e.expect(e.element(e.by.accessibilityLabel('test'))).not.toHaveId(/id/);
      await e.expect(e.element(e.by.accessibilityLabel('test'))).toHaveValue('value');
      await e.expect(e.element(e.by.accessibilityLabel('test'))).toNotHaveValue('value');
      await e.expect(e.element(e.by.accessibilityLabel('test'))).not.toHaveValue('value');
      await e.expect(e.element(e.by.accessibilityLabel('test'))).toHaveToggleValue(true);
      await e.expect(e.element(e.by.accessibilityLabel('test'))).not.toHaveToggleValue(true);
      await e.expect(e.element(e.by.accessibilityLabel('test'))).toBeFocused();
      await e.expect(e.element(e.by.accessibilityLabel('test'))).toBeNotFocused();
    });

    it(`element by label (for backwards compat)`, async () => {
      await e.expect(e.element(e.by.label('test'))).toBeVisible();
      await e.expect(e.element(e.by.label('test'))).toBeVisible(35);
      await e.expect(e.element(e.by.label('test'))).toBeNotVisible();
      await e.expect(e.element(e.by.label('test'))).toExist();
      await e.expect(e.element(e.by.label('test'))).toNotExist();
      await e.expect(e.element(e.by.label('test'))).toHaveText('text');
      await e.expect(e.element(e.by.label('test'))).toHaveLabel('label');
      await e.expect(e.element(e.by.label('test'))).toHaveId('id');
      await e.expect(e.element(e.by.label('test'))).toHaveValue('value');
      await e.expect(e.element(e.by.label('test'))).toHaveToggleValue(false);
      await e.expect(e.element(e.by.label('test'))).not.toHaveToggleValue(false);
      await e.expect(e.element(e.by.label('test'))).toBeFocused();
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

    test.each([
      ['withAncestor'],
      ['withDescendant'],
      ['and'],
    ])(`matcher immutability: %s`, async (combineMethodName) => {
      const base = e.by.id('test');
      const modifier = e.by.id('ancestor');

      expect(base[combineMethodName](modifier)).not.toBe(base);
      expect(base).toEqual(e.by.id('test'));
      expect(modifier).toEqual(e.by.id('ancestor'));
    });

    it(`should throw for invalid toBeVisible parameters`, async () => {
      const stubMatcher = e.element(e.by.label('test'));
      const expectedErrorMsg = 'must be an integer between 1 and 100';

      await jestExpect(() => e.expect(stubMatcher).toBeVisible(0)).rejects.toThrow(expectedErrorMsg);
      await jestExpect(() => e.expect(stubMatcher).not.toBeVisible(0)).rejects.toThrow(expectedErrorMsg);
      await jestExpect(() => e.expect(stubMatcher).toBeVisible(101)).rejects.toThrow(expectedErrorMsg);
      await jestExpect(() => e.expect(stubMatcher).not.toBeVisible(101)).rejects.toThrow(expectedErrorMsg);

      jestExpect(() => e.waitFor(stubMatcher).toBeVisible(0)).toThrow(expectedErrorMsg);
      jestExpect(() => e.waitFor(stubMatcher).toBeVisible(101)).toThrow(expectedErrorMsg);
    });

    it(`expect with wrong parameters should throw`, async () => {
      jestExpect(() => e.expect('notAnElement')).toThrow();
      jestExpect(() => e.expect(e.element('notAMatcher'))).toThrow();
    });

    it(`matchers with wrong parameters should throw`, async () => {
      jestExpect(() => e.by.label(5)).toThrow();
      jestExpect(() => e.by.accessibilityLabel(5)).toThrow();
      jestExpect(() => e.by.id(5)).toThrow();
      jestExpect(() => e.by.type(0)).toThrow();
      jestExpect(() => e.by.traits(1)).toThrow();
      jestExpect(() => e.by.value(0)).toThrow();
      jestExpect(() => e.by.text(0)).toThrow();

      const expectedErrorMsg = 'Expected a matcher, got: \'notAMatcher\'';
      jestExpect(() => e.element(e.by.id('test').withAncestor('notAMatcher'))).toThrow(expectedErrorMsg);
      jestExpect(() => e.element(e.by.id('test').withDescendant('notAMatcher'))).toThrow(expectedErrorMsg);
      jestExpect(() => e.element(e.by.id('test').and('notAMatcher'))).toThrow(expectedErrorMsg);
      jestExpect(() => e.element(e.by.id('test').or('notAMatcher'))).toThrow(expectedErrorMsg);
    });

    it(`waitFor (element)`, async () => {
      await e.waitFor(e.element(e.by.id('id'))).toExist().withTimeout(0);
      await e.waitFor(e.element(e.by.id('id'))).not.toExist().withTimeout(0);

      await e.waitFor(e.element(e.by.id('id'))).toBeVisible();
      await e.waitFor(e.element(e.by.id('id'))).toBeVisible(35);
      await e.waitFor(e.element(e.by.id('id'))).toBeNotVisible();
      await e.waitFor(e.element(e.by.id('id'))).not.toBeVisible();

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

      await e.waitFor(e.element(e.by.id('id'))).toBeFocused().withTimeout(0);
      await e.waitFor(e.element(e.by.id('id'))).toBeNotFocused().withTimeout(0);
    });

    it(`waitFor (element) with wrong parameters should throw`, async () => {
      jestExpect(() => e.waitFor('notAnElement')).toThrow();
      jestExpect(() => e.waitFor(e.element(e.by.id('id'))).toBeVisible().whileElement('notAnElement')).toThrow();

      await jestExpect(() => e.waitFor(e.element(e.by.id('id'))).toExist().withTimeout('notANumber')).rejects.toThrow();
      await jestExpect(() => e.waitFor(e.element(e.by.id('id'))).toExist().withTimeout(-1)).rejects.toThrow();
    });

    it(`waitFor (element) with non-elements should throw`, async () => {
      jestExpect(() => e.waitFor('notAnElement')).toThrow();
    });

    it('toHaveSliderPosition', async () => {
      await e.expect(e.element(e.by.id('sliderWithASimpleID'))).toHaveSliderPosition(0.25);
      await e.expect(e.element(e.by.id('sliderWithASimpleID'))).toHaveSliderPosition(0.25, 0.1);
      await e.expect(e.element(e.by.id('sliderWithASimpleID'))).not.toHaveSliderPosition(0.25);
      await e.expect(e.element(e.by.id('sliderWithASimpleID'))).not.toHaveSliderPosition(0.25, 0.1);
    });

    describe('element interactions', () => {
      it('should tap and long-press', async () => {
        await e.element(e.by.label('Tap Me')).tap();
        await e.element(e.by.label('Tap Me')).tap({ x: 10, y: 10 });
        await e.element(e.by.label('Tap Me')).tapAtPoint({ x: 100, y: 200 });
        await e.element(e.by.label('Tap Me')).longPress();
        await e.element(e.by.label('Tap Me')).longPress(1000);
        await e.element(e.by.label('Tap Me')).longPress({ x: 10, y: 10 }, 1000);
        await e.element(e.by.label('Tap Me')).longPress({ x: 10, y: 10 });
        await e.element(e.by.id('UniqueId819')).multiTap(3);
      });

      it('should not tap and long-press given bad args', async () => {
        await [null, undefined, 0, -1, 'NaN'].forEach(item => {
          jestExpect(() => e.element(e.by.id('UniqueId819')).multiTap(item)).rejects.toThrow();
        });

        await jestExpect(() => e.element(e.by.label('Tap Me')).longPress('NaN')).rejects.toThrow();
        await jestExpect(() => e.element(e.by.label('Tap Me')).longPress('NaN', 1000)).rejects.toThrow();
        await jestExpect(() => e.element(e.by.label('Tap Me')).longPress({ x: 'NaN', y: 10 }, 1000)).rejects.toThrow();
        await jestExpect(() => e.element(e.by.label('Tap Me')).longPress({ x: 10, y: 'NaN' }, 1000)).rejects.toThrow();
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
        await jestExpect(() => e.element(e.by.id('UniqueId937')).typeText(0)).rejects.toThrow();
        await jestExpect(() => e.element(e.by.id('UniqueId005')).replaceText(3)).rejects.toThrow();
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
        await e.element(e.by.id('ScrollView161')).scrollToIndex(0);
      });

      it('should not scroll given bad args', async () => {
        await jestExpect(() => e.element(e.by.id('ScrollView161')).scroll('NaN', 'down')).rejects.toThrow();
        await jestExpect(() => e.element(e.by.id('ScrollView161')).scroll(100, 'noDirection')).rejects.toThrow();
        await jestExpect(() => e.element(e.by.id('ScrollView161')).scroll(100, 0)).rejects.toThrow();
        await jestExpect(() => e.element(e.by.id('ScrollView161')).scrollTo(0)).rejects.toThrow();
        await jestExpect(() => e.element(e.by.id('ScrollView161')).scrollTo('noDirection')).rejects.toThrow();
      });

      it('should setDatePickerDate', async () => {
        await e.element(e.by.type('android.widget.DatePicker')).setDatePickerDate('2019-02-06T05:10:00-08:00', 'ISO8601');
        await e.element(e.by.type('android.widget.DatePicker')).setDatePickerDate('2019/02/06', 'YYYY/MM/DD');
        await e.element(e.by.type('android.widget.DatePicker')).setDatePickerDate('2019-02-06', 'YYYY-MM-DD');
      });

      it('should not setDatePickerDate given bad args', async () => {
        await jestExpect(() => e.element(e.by.type('android.widget.DatePicker')).setDatePickerDate('2019-02-06T05:10:00-08:00')).rejects.toThrow();
        await jestExpect(() => e.element(e.by.type('android.widget.DatePicker')).setDatePickerDate(2019, 'ISO8601')).rejects.toThrow();
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

      it('should long press and drag', async () => {
        await e.element(e.by.id('draggable')).longPressAndDrag(1000, 0.5, 0.5, e.element(e.by.id('DragAndDropTarget')), 0.5, 0.5, 'fast', 0);
        await e.element(e.by.id('draggable')).longPressAndDrag(1000, 0.5, 0.5, e.element(e.by.id('DragAndDropTarget')), 0.5, 0.5, 'slow', 0);
      });

      it('should not swipe given bad args', async () => {
        await jestExpect(() => e.element(e.by.id('ScrollView799')).swipe(4, 'fast')).rejects.toThrow();
        await jestExpect(() => e.element(e.by.id('ScrollView799')).swipe('noDirection', 0)).rejects.toThrow();
        await jestExpect(() => e.element(e.by.id('ScrollView799')).swipe('noDirection', 'fast')).rejects.toThrow();
        await jestExpect(() => e.element(e.by.id('ScrollView799')).swipe('down', 'NotFastNorSlow')).rejects.toThrow();
        await jestExpect(() => e.element(e.by.id('ScrollView799')).swipe('down', 'NotFastNorSlow', 0.9)).rejects.toThrow();
      });

      it('should allow for index-based element discrepancy resolution', async () => {
        await e.element(e.by.id('ScrollView799')).atIndex(1);
      });

      it('should fail to find index-based element given invalid args', async () => {
        jestExpect(() => e.element(e.by.id('ScrollView799')).atIndex('NaN')).toThrow();
      });

      it('should retrieve attributes', async () => {
        const execResult = {
          text: 'hello',
          value: 1,
        };
        mockExecutor.executeResult = Promise.resolve(execResult);
        const result = await e.element(e.by.id('UniqueId005')).getAttributes();
        expect(result).toEqual(execResult);
      });

      it('should adjust slider to position', async () => {
        await e.element(e.by.id('sliderWithASimpleID')).adjustSliderToPosition(75);
      });

      it('should perform accessibility actions', async () => {
        await e.element(e.by.id('View7991')).performAccessibilityAction('activate');
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

  describe('web', () => {
    describe('General', () => {
      it('should return undefined', async () => {
        mockExecutor.executeResult = Promise.resolve(undefined);
        await e.web(e.by.id('webview_id')).element(e.by.web.id('any')).tap();
      });
    });

    describe('web', () => {
      it('default', async () => {
        await e.web.element(e.by.web.id('id')).tap();
      });

      it('default explicit', async () => {
        await e.web().element(e.by.web.id('id')).tap();
      });

      it('with webview matcher', async () => {
        await e.web(e.by.id('webview_id')).element(e.by.web.id('id')).tap();
      });

      it(`with wrong matcher arguments - should throw`, async () => {
        jestExpect(() => e.web(e.by.web.className('webMatcher'))).toThrow();
        jestExpect(() => e.web(e.by.web.cssSelector('webMatcher'))).toThrow();
        jestExpect(() => e.web(e.by.web.id('webMatcher'))).toThrow();
        jestExpect(() => e.web(e.by.web.href('webMatcher'))).toThrow();
        jestExpect(() => e.web(e.by.web.name('webMatcher'))).toThrow();
        jestExpect(() => e.web(e.by.web.hrefContains('webMatcher'))).toThrow();
        jestExpect(() => e.web(e.by.web.tag('webMatcher'))).toThrow();
        jestExpect(() => e.web(e.by.web.xpath('webMatcher'))).toThrow();
      });

      it('with at-index should throw', async () => {
        jestExpect(() => e.web(e.by.id('webview_id')).atIndex(1).element(e.by.web.id('id')).tap()).toThrow();
      });

      it(`inner element with wrong matcher should throw`, async () => {
        jestExpect(() => e.web.element(e.by.accessibilityLabel('nativeMatcher'))).toThrow();
        jestExpect(() => e.web.element(e.by.id('nativeMatcher'))).toThrow();
        jestExpect(() => e.web.element(e.by.label('nativeMatcher'))).toThrow();
        jestExpect(() => e.web.element(e.by.text('nativeMatcher'))).toThrow();
        jestExpect(() => e.web.element(e.by.traits('nativeMatcher'))).toThrow();
        jestExpect(() => e.web.element(e.by.value('nativeMatcher'))).toThrow();
      });
    });

    describe('WebElement Actions', () => {
      it('tap', async () => {
        await e.web.element(e.by.web.id('id')).tap();
        await e.web.element(e.by.web.className('className')).tap();
        await e.web.element(e.by.web.cssSelector('cssSelector')).tap();
        await e.web.element(e.by.web.name('name')).tap();
        await e.web.element(e.by.web.xpath('xpath')).tap();
        await e.web.element(e.by.web.href('linkText')).tap();
        await e.web.element(e.by.web.hrefContains('partialLinkText')).tap();
        await e.web.element(e.by.web.tag('tag')).tap();
      });

      it('typeText', async () => {
        await e.web.element(e.by.web.id('id')).typeText('text');
        await e.web.element(e.by.web.className('className')).typeText('text');
        await e.web.element(e.by.web.cssSelector('cssSelector')).typeText('text');
        await e.web.element(e.by.web.name('name')).typeText('text');
        await e.web.element(e.by.web.xpath('xpath')).typeText('text');
        await e.web.element(e.by.web.href('linkText')).typeText('text');
        await e.web.element(e.by.web.hrefContains('partialLinkText')).typeText('text');
        await e.web.element(e.by.web.tag('tag')).typeText('text');
      });

      it('typeText with isContentEditable=false', async () => {
        await e.web.element(e.by.web.id('id')).typeText('text', false);
        global.expect(device._typeText).not.toHaveBeenCalled();
      });

      it('typeText with isContentEditable=true', async () => {
        await e.web.element(e.by.web.id('id')).typeText('text', true);
        global.expect(device._typeText).toHaveBeenCalled();
      });

      it('typeText default isContentEditable is false', async () => {
        await e.web.element(e.by.web.id('id')).typeText('text');
        global.expect(device._typeText).not.toHaveBeenCalled();
      });

      it('replaceText', async () => {
        await e.web.element(e.by.web.id('id')).replaceText('text');
        await e.web.element(e.by.web.className('className')).replaceText('text');
        await e.web.element(e.by.web.cssSelector('cssSelector')).replaceText('text');
        await e.web.element(e.by.web.name('name')).replaceText('text');
        await e.web.element(e.by.web.xpath('xpath')).replaceText('text');
        await e.web.element(e.by.web.href('linkText')).replaceText('text');
        await e.web.element(e.by.web.hrefContains('partialLinkText')).replaceText('text');
        await e.web.element(e.by.web.tag('tag')).replaceText('text');
      });

      it('clearText', async () => {
        await e.web.element(e.by.web.id('id')).clearText();
        await e.web.element(e.by.web.className('className')).clearText();
        await e.web.element(e.by.web.cssSelector('cssSelector')).clearText();
        await e.web.element(e.by.web.name('name')).clearText();
        await e.web.element(e.by.web.xpath('xpath')).clearText();
        await e.web.element(e.by.web.href('linkText')).clearText();
        await e.web.element(e.by.web.hrefContains('partialLinkText')).clearText();
        await e.web.element(e.by.web.tag('tag')).clearText();
      });

      it('scrollToView', async () => {
        await e.web.element(e.by.web.id('id')).scrollToView();
        await e.web.element(e.by.web.className('className')).scrollToView();
        await e.web.element(e.by.web.cssSelector('cssSelector')).scrollToView();
        await e.web.element(e.by.web.name('name')).scrollToView();
        await e.web.element(e.by.web.xpath('xpath')).scrollToView();
        await e.web.element(e.by.web.href('linkText')).scrollToView();
        await e.web.element(e.by.web.hrefContains('partialLinkText')).scrollToView();
        await e.web.element(e.by.web.tag('tag')).scrollToView();
      });

      it('getText', async () => {
        await e.web.element(e.by.web.id('id')).getText();
        await e.web.element(e.by.web.className('className')).getText();
        await e.web.element(e.by.web.cssSelector('cssSelector')).getText();
        await e.web.element(e.by.web.name('name')).getText();
        await e.web.element(e.by.web.xpath('xpath')).getText();
        await e.web.element(e.by.web.href('linkText')).getText();
        await e.web.element(e.by.web.hrefContains('partialLinkText')).getText();
        await e.web.element(e.by.web.tag('tag')).getText();
      });

      it('focus', async () => {
        await e.web.element(e.by.web.id('id')).focus();
        await e.web.element(e.by.web.className('className')).focus();
        await e.web.element(e.by.web.cssSelector('cssSelector')).focus();
        await e.web.element(e.by.web.name('name')).focus();
        await e.web.element(e.by.web.xpath('xpath')).focus();
        await e.web.element(e.by.web.href('linkText')).focus();
        await e.web.element(e.by.web.hrefContains('partialLinkText')).focus();
        await e.web.element(e.by.web.tag('tag')).focus();
      });

      it('selectAllText', async () => {
        await e.web.element(e.by.web.id('id')).selectAllText();
        await e.web.element(e.by.web.className('className')).selectAllText();
        await e.web.element(e.by.web.cssSelector('cssSelector')).selectAllText();
        await e.web.element(e.by.web.name('name')).selectAllText();
        await e.web.element(e.by.web.xpath('xpath')).selectAllText();
        await e.web.element(e.by.web.href('linkText')).selectAllText();
        await e.web.element(e.by.web.hrefContains('partialLinkText')).selectAllText();
        await e.web.element(e.by.web.tag('tag')).selectAllText();
      });

      it('moveCursorToEnd', async () => {
        await e.web.element(e.by.web.id('id')).moveCursorToEnd();
        await e.web.element(e.by.web.className('className')).moveCursorToEnd();
        await e.web.element(e.by.web.cssSelector('cssSelector')).moveCursorToEnd();
        await e.web.element(e.by.web.name('name')).moveCursorToEnd();
        await e.web.element(e.by.web.xpath('xpath')).moveCursorToEnd();
        await e.web.element(e.by.web.href('linkText')).moveCursorToEnd();
        await e.web.element(e.by.web.hrefContains('partialLinkText')).moveCursorToEnd();
        await e.web.element(e.by.web.tag('tag')).moveCursorToEnd();
      });

      it('runScript', async () => {
        const script = 'function named(el) { return el.textContent; }';
        await e.web.element(e.by.web.id('id')).runScript(function () {});
        await e.web.element(e.by.web.className('className')).runScript((el) => el.textContent);
        await e.web.element(e.by.web.cssSelector('cssSelector')).runScript(function named(..._args) {});
        await e.web.element(e.by.web.name('name')).runScript(script);
        await e.web.element(e.by.web.xpath('xpath')).runScript(script);
        await e.web.element(e.by.web.href('linkText')).runScript(script);
        await e.web.element(e.by.web.hrefContains('partialLinkText')).runScript(script);
        await e.web.element(e.by.web.tag('tag')).runScript(script);
      });

      it('runScript (unhappy)', async () => {
        await expect(e.web.element(e.by.web.id('id')).runScript(/nonsense/)).rejects.toThrow(/script should be a string, but got \/nonsense\//);
        await expect(e.web.element(e.by.web.id('id')).runScript(null, [])).rejects.toThrow(/script should be a string, but got null/);
        await expect(e.web.element(e.by.web.id('id')).runScript('return el.textContent')).rejects.toThrow(/Expected a valid function string, but got: return el.textContent/);
      });

      it('runScript (with args)', async () => {
        const script = 'function bar(a,b) {}';
        const argsArr = ['fooA', 40];
        await e.web.element(e.by.web.id('id')).runScript(script, argsArr);
        await e.web.element(e.by.web.className('className')).runScript(script, argsArr);
        await e.web.element(e.by.web.cssSelector('cssSelector')).runScript(script, argsArr);
        await e.web.element(e.by.web.name('name')).runScript(script, argsArr);
        await e.web.element(e.by.web.xpath('xpath')).runScript(script, argsArr);
        await e.web.element(e.by.web.href('linkText')).runScript(script, argsArr);
        await e.web.element(e.by.web.hrefContains('partialLinkText')).runScript(script, argsArr);
        await e.web.element(e.by.web.tag('tag')).runScript(script, argsArr);
      });

      it('getCurrentUrl', async () => {
        await e.web.element(e.by.web.id('id')).getCurrentUrl();
        await e.web.element(e.by.web.className('className')).getCurrentUrl();
        await e.web.element(e.by.web.cssSelector('cssSelector')).getCurrentUrl();
        await e.web.element(e.by.web.name('name')).getCurrentUrl();
        await e.web.element(e.by.web.xpath('xpath')).getCurrentUrl();
        await e.web.element(e.by.web.href('linkText')).getCurrentUrl();
        await e.web.element(e.by.web.hrefContains('partialLinkText')).getCurrentUrl();
        await e.web.element(e.by.web.tag('tag')).getCurrentUrl();
      });

      it('getTitle', async () => {
        await e.web.element(e.by.web.id('id')).getTitle();
        await e.web.element(e.by.web.className('className')).getTitle();
        await e.web.element(e.by.web.cssSelector('cssSelector')).getTitle();
        await e.web.element(e.by.web.name('name')).getTitle();
        await e.web.element(e.by.web.xpath('xpath')).getTitle();
        await e.web.element(e.by.web.href('linkText')).getTitle();
        await e.web.element(e.by.web.hrefContains('partialLinkText')).getTitle();
        await e.web.element(e.by.web.tag('tag')).getTitle();
      });

      it('should allow for access to by via element', async () => {
        const webview = await e.web;
        await webview.element(e.by.web.id('id')).tap();
      });
    });

    describe('Web Matchers',() => {
      it('by.web.id', async () => {
        await e.expect(e.web.element(e.by.web.id('id'))).toExist();
        await e.expect(e.web.element(e.by.web.id('id'))).not.toExist();
        await e.expect(e.web.element(e.by.web.id('id'))).toHaveText('text');
        await e.expect(e.web.element(e.by.web.id('id'))).not.toHaveText('text');
      });

      it('by.web.className', async () => {
        await e.expect(e.web.element(e.by.web.className('className'))).toExist();
        await e.expect(e.web.element(e.by.web.className('className'))).not.toExist();
        await e.expect(e.web.element(e.by.web.className('className'))).toHaveText('text');
        await e.expect(e.web.element(e.by.web.className('className'))).not.toHaveText('text');
      });

      it('by.web.cssSelector', async () => {
        await e.expect(e.web.element(e.by.web.cssSelector('cssSelector'))).toExist();
        await e.expect(e.web.element(e.by.web.cssSelector('cssSelector'))).not.toExist();
        await e.expect(e.web.element(e.by.web.cssSelector('cssSelector'))).toHaveText('text');
        await e.expect(e.web.element(e.by.web.cssSelector('cssSelector'))).not.toHaveText('text');
      });

      it('by.web.name', async () => {
        await e.expect(e.web.element(e.by.web.name('name'))).toExist();
        await e.expect(e.web.element(e.by.web.name('name'))).not.toExist();
        await e.expect(e.web.element(e.by.web.name('name'))).toHaveText('text');
        await e.expect(e.web.element(e.by.web.name('name'))).not.toHaveText('text');
      });

      it('by.web.xpath', async () => {
        await e.expect(e.web.element(e.by.web.xpath('xpath'))).toExist();
        await e.expect(e.web.element(e.by.web.xpath('xpath'))).not.toExist();
        await e.expect(e.web.element(e.by.web.xpath('xpath'))).toHaveText('text');
        await e.expect(e.web.element(e.by.web.xpath('xpath'))).not.toHaveText('text');
      });

      it('by.web.href', async () => {
        await e.expect(e.web.element(e.by.web.href('link'))).toExist();
        await e.expect(e.web.element(e.by.web.href('link'))).not.toExist();
        await e.expect(e.web.element(e.by.web.href('link'))).toHaveText('text');
        await e.expect(e.web.element(e.by.web.href('link'))).not.toHaveText('text');
      });

      it('by.web.hrefContains', async () => {
        await e.expect(e.web.element(e.by.web.hrefContains('lin'))).toExist();
        await e.expect(e.web.element(e.by.web.hrefContains('lin'))).not.toExist();
        await e.expect(e.web.element(e.by.web.hrefContains('lin'))).toHaveText('text');
        await e.expect(e.web.element(e.by.web.hrefContains('lin'))).not.toHaveText('text');
      });

      it('by.web.tag', async () => {
        await e.expect(e.web.element(e.by.web.tag('tag'))).toExist();
        await e.expect(e.web.element(e.by.web.tag('tag'))).not.toExist();
        await e.expect(e.web.element(e.by.web.tag('tag'))).toHaveText('text');
        await e.expect(e.web.element(e.by.web.tag('tag'))).not.toHaveText('text');
      });

      it('should allow for access to except via element', async () => {
        const webview = e.web();
        await e.expect(webview.element(e.by.web.id('id'))).toExist();
      });
    });
  });
});

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
