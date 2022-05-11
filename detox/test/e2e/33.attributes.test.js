const { device, element, by } = require('detox');
const expect = require('expect').default;

describe('Attributes', () => {
  /** @type {Detox.IndexableNativeElement} */
  let currentElement;
  /** @type {Detox.ElementAttributes} */
  let attributes;
  /** @type {Detox.ElementAttributes[]} */
  let attributesArray;

  /**
   * @param {Detox.NativeMatcher} matcher
   */
  function useMatcher(matcher) {
    return async () => {
      currentElement = element(matcher);
      const result = await currentElement.getAttributes();
      if ('elements' in result) {
        attributesArray = result.elements;
      } else {
        attributes = await result;
      }
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
        ...shapes.IosElementAttribute(),
        hittable: true,
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
        textSize: expect.any(Number),
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

    it(':ios: should have a string .value', async () => {
      expect(await currentElement.getAttributes()).toMatchObject({
        value: expect.stringContaining('off'),
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

  describe('of a legacy slider', () => {
    beforeAll(useMatcher(by.id('legacySliderId')));

    it(':ios: should have a string percent .value, and .normalizedSliderPosition', () => {
      expect(attributes).toMatchObject({ value: '50%', normalizedSliderPosition: 0.5 });
    });

    it(':android: should have a number .value', () => {
      expect(attributes).toMatchObject({ value: 0.5 });
    });
  });

  describe('of a slider', () => {
    beforeAll(useMatcher(by.id('sliderId')));

    it(':ios: should have a string percent .value, and .normalizedSliderPosition', () => {
      expect(attributes).toMatchObject({ value: '50%', normalizedSliderPosition: 0.5 });
    });

    it(':android: should have a number .value', () => {
      expect(attributes).toMatchObject({ value: 0.5 });
    });
  });

  describe('of a date picker', () => {
    beforeAll(useMatcher(by.id('attrDatePicker')));

    it(':ios: should have Date .value', () => {
      expect(attributes).toMatchObject({
        date: expect.stringMatching(/^2022-01-01T00:00:00[+\-]\d{2}:\d{2}$/),
      });
    });
  });

  describe('of a scroll view', () => {
    beforeAll(useMatcher(by.type('RCTCustomScrollView').withAncestor(by.id('attrScrollView'))));

    it(':ios: should have offsets and insets', async () => {
      expect(attributes).toMatchObject({
        contentOffset: shapes.Point2D(),
        contentInset: shapes.IosElementAttributesInsets(),
        adjustedContentInset: shapes.IosElementAttributesInsets(),
      });
    });
  });

  describe('of multiple views', () => {
    describe(':ios:', () => {
      beforeAll(useMatcher(by.type('RCTView').withAncestor(by.id('attrScrollView'))));

      it('should return an object with .elements array', async () => {
        const viewShape = {
          identifier: expect.any(String),
          enabled: true,
          visible: true,
          activationPoint: shapes.Point2D(),
          normalizedActivationPoint: shapes.Point2D(),
          hittable: true,
          frame: shapes.IosElementAttributeFrame(),
          elementFrame: shapes.IosElementAttributeFrame(),
          elementBounds: shapes.IosElementAttributeFrame(),
          safeAreaInsets: shapes.IosElementAttributesInsets(),
          elementSafeBounds: shapes.IosElementAttributeFrame(),
          layer: expect.stringMatching(/^<CALayer: 0x[\da-f]+>$/),
        };

        const innerViews = attributesArray.filter(a => a.identifier);
        expect(innerViews.length).toBe(2);
        expect(innerViews[0]).toMatchObject({ ...viewShape, hittable: true });
        expect(innerViews[1]).toMatchObject({ ...viewShape, hittable: false });
      });
    });

    describe(':android:', () => {
      // TODO (@jonathanmos) : Can we decide something about it officially?
      it('should throw an error (because it is not implemented)', async () => {
        await expect(
          element(
            by.type('com.facebook.react.views.view.ReactViewGroup')
              .withAncestor(by.id('attrScrollView'))
          ).getAttributes()
        ).rejects.toThrowError(/Problem views are marked with '.{4}MATCHES.{4}' below/m);
      });
    });
  });
});

const shapes = {
  Point2D: () => ({
    x: expect.any(Number),
    y: expect.any(Number),
  }),
  IosElementAttribute: () => ({
    activationPoint: shapes.Point2D(),
    normalizedActivationPoint: shapes.Point2D(),
    hittable: expect.any(Boolean),
    frame: shapes.IosElementAttributeFrame(),
    elementFrame: shapes.IosElementAttributeFrame(),
    elementBounds: shapes.IosElementAttributeFrame(),
    safeAreaInsets: shapes.IosElementAttributesInsets(),
    elementSafeBounds: shapes.IosElementAttributeFrame(),
    layer: expect.stringMatching(/^<CALayer: 0x[\da-f]+>$/),
  }),
  IosElementAttributeFrame: () => ({
    y: expect.any(Number),
    x: expect.any(Number),
    width: expect.any(Number),
    height: expect.any(Number),
  }),
  IosElementAttributesInsets: () => ({
    right: expect.any(Number),
    top: expect.any(Number),
    left: expect.any(Number),
    bottom: expect.any(Number),
  }),
};
