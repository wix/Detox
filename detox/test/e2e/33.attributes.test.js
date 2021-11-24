const { device, element, by } = require('detox');
const expect = require('expect');

describe('Attributes', () => {
  /** @type {Detox.IndexableNativeElement} */
  let currentElement;
  /** @type {Detox.ElementAttributes} */
  let attributes;

  /**
   * @param {Detox.NativeMatcher} matcher
   */
  function useMatcher(matcher) {
    return async () => {
      currentElement = element(matcher);
      attributes = await currentElement.getAttributes();
    };
  }

  beforeAll(async () => {
    await device.reloadReactNative();
    await element(by.text('Attributes')).tap();
  });

  describe('of a view', () => {
    beforeAll(useMatcher(by.id('viewId')));

    it('should have the corresponding shape', () =>
      expect(attributes).toMatchObject({
        identifier: 'viewId',
        enabled: true,
        visible: true,
      }));

    it(':ios: should have the corresponding shape', () =>
      expect(attributes).toMatchObject({
        activationPoint: shapes.Point2D(),
        normalizedActivationPoint: shapes.Point2D(),
        hittable: true,
        frame: shapes.IosElementAttributes(),
        elementFrame: shapes.IosElementAttributes(),
        elementBounds: shapes.IosElementAttributes(),
        safeAreaInsets: shapes.IosElementAttributeInsets(),
        elementSafeBounds: shapes.IosElementAttributes(),
        layer: expect.stringMatching(/^<CALayer: 0x[0-9a-f]+>$/),
      }));

    it(':android: should have the corresponding shape', () => {
      expect(attributes).toMatchObject({
        visibility: 'visible',
        width: expect.any(Number),
        height: expect.any(Number),
        elevation: 0,
        alpha: 1,
        focused: false,
      });
    });
  });

  describe('of a text', () => {
    const EXPECTED_TEXT = 'TextView';
    const EXPECTED_FONT_SIZE = 37.0;

    beforeAll(useMatcher(by.id('textViewId')));

    it('should have the corresponding shape', () => {
      expect(attributes).toMatchObject({
        text: EXPECTED_TEXT,
        label: EXPECTED_TEXT,
      });
    });

    it(':ios: should not have any extra properties', () => {
      expect(attributes).not.toMatchObject({
        placeholder: expect.anything(),
        value: expect.anything(),
        date: expect.anything(),
        normalizedSliderPosition: expect.anything(),
        contentOffset: expect.anything(),
        contentInset: expect.anything(),
        adjustedContentInset: expect.anything(),
      });
    });

    it(':android: should have the corresponding shape', () => {
      expect(attributes).toMatchObject({
        textSize: EXPECTED_FONT_SIZE,
        length: EXPECTED_TEXT.length,
      });
    });
  });

  describe('of a text input', () => {
    describe('(blurred)', () => {
      beforeAll(useMatcher(by.id('blurredTextInputId')));

      it('should have the corresponding attributes', () => {
        expect(attributes).toMatchObject({
          text: 'blurred',
          placeholder: 'palace-holder',
        });
      });

      it(':android: should not be .focused', () => {
        expect(attributes).toMatchObject({
          focused: false
        });
      });
    });

    describe('(focused)', () => {
      beforeAll(useMatcher(by.id('focusedTextInputId')));

      it('should have the corresponding attributes', () => {
        expect(attributes).toMatchObject({
          text: 'focused',
          placeholder: 'palace-holder',
        });
      });

      it(':android: should have the corresponding attributes', () => {
        expect(attributes).toMatchObject({
          focused: true
        });
      });
    });
  });

  describe('of a checkbox', () => {
    beforeAll(useMatcher(by.id('checkboxId')));

    it(':ios: should not have any .value (because it is not implemented)', async () => {
      expect(await currentElement.getAttributes()).not.toMatchObject({
        value: expect.anything(),
      });
    });

    it(':android: should have a boolean .value', async () => {
      expect(await currentElement.getAttributes()).toMatchObject({
        value: false
      });

      await currentElement.tap();

      expect(await currentElement.getAttributes()).toMatchObject({
        value: true
      });
    });
  });

  describe('of a slider', () => {
    beforeAll(useMatcher(by.id('sliderId')));

    it(':ios: should have a string percent .value, and .normalizedSliderPosition', () => {
      expect(attributes).toMatchObject({ value: '50%', normalizedSliderPosition: 0.5 });
    });

    it(':android: should have a number .value', () => {
      const MIDDLE = 0.5 * 128; // Why 1 is 128 in RN? I'm not sure... maybe px vs. dp?! :shrug:
      expect(attributes).toMatchObject({ value: MIDDLE });
    });
  });

  describe.skip('of a date picker', () => {
    /*
      iOS:
      - [ ] date: undefined,
    */
  });

  describe.skip('of a scroll view', () => {
    /*
      iOS:
      - [ ] contentOffset: undefined,
      - [ ] contentInset: undefined,
      - [ ] adjustedContentInset: undefined,
    */
  });

  describe.skip('of a scroll view child', () => {
    /*
      iOS:
      - [ ] contentOffset: undefined,
      - [ ] contentInset: undefined,
      - [ ] adjustedContentInset: undefined,
    */
  });

  describe.skip('of multiple views', () => {
    // test Array<Promise>
  });
});

const shapes = {
  Point2D: () => ({
    x: expect.any(Number),
    y: expect.any(Number),
  }),
  IosElementAttributes: () => ({
    y: expect.any(Number),
    x: expect.any(Number),
    width: expect.any(Number),
    height: expect.any(Number),
  }),
  IosElementAttributeInsets: () => ({
    right: expect.any(Number),
    top: expect.any(Number),
    left: expect.any(Number),
    bottom: expect.any(Number),
  }),
};
