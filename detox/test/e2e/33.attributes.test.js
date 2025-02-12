const { device, element, by } = require('detox');
const expect = require('expect').default;

describe('Attributes', () => {
  /** @type {Detox.IndexableNativeElement} */
  let currentElement;
  /** @type {Detox.IosElementAttributes | Detox.AndroidElementAttributes} */
  let attributes;
  /** @type {Detox.IosElementAttributes[] | Detox.AndroidElementAttributes[]} */
  let attributesArray;

  /**
   * @param {Detox.NativeMatcher} matcher
   */
  async function useMatcher(matcher) {
    currentElement = element(matcher);
    const result = await currentElement.getAttributes();

    if ('elements' in result) {
      attributesArray = result.elements;
    } else {
      attributes = result;
    }
  }

  beforeAll(async () => {
    await device.reloadReactNative();
    await element(by.text('Attributes')).tap();
  });

  describe('of a view', () => {
    beforeAll(() => useMatcher(by.id('viewId')));

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

    beforeAll(() => useMatcher(by.id('textViewId')));

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

  describe('of a text group', () => {
    const EXPECTED_TEXT = 'InnerText1 InnerText2';

    beforeAll(() => useMatcher(by.id('textGroupRoot')));

    it('should have a label based on text concatenation', () => {
      expect(attributes).toMatchObject({ label: EXPECTED_TEXT });
    });
  });

  describe('of a text input', () => {
    describe('(blurred)', () => {
      beforeAll(() => useMatcher(by.id('blurredTextInputId')));

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
      beforeAll(() => useMatcher(by.id('focusedTextInputId')));

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
    beforeAll(() => useMatcher(by.id('checkboxId')));

    it(':ios: should have a string .value', async () => {
      expect(await currentElement.getAttributes()).toMatchObject({
        value: expect.stringContaining('off'),
      });
    });

    // Checkbox is not working with the new arch yet
    it.skip(':android: should have a boolean .value', async () => {
      expect(await currentElement.getAttributes()).toMatchObject({
        value: false
      });

      await currentElement.tap();

      expect(await currentElement.getAttributes()).toMatchObject({
        value: true
      });
    });
  });

  describe('of a legacy slider (@rn71)', () => {
    beforeAll(() => useMatcher(by.id('legacySliderId')));

    it(':ios: should have a string percent .value, and .normalizedSliderPosition', () => {
      expect(attributes).toMatchObject({ value: '50%', normalizedSliderPosition: 0.5 });
    });

    it(':android: should have a number .value', () => {
      expect(attributes).toMatchObject({ value: 0.5 });
    });
  });

  describe('of a slider', () => {
    beforeAll(() => useMatcher(by.id('sliderId')));

    it(':ios: should have a string percent .value, and .normalizedSliderPosition', () => {
      expect(attributes).toMatchObject({ value: '50%', normalizedSliderPosition: 0.5 });
    });

    it(':android: should have a number .value', () => {
      expect(attributes).toMatchObject({ value: 0.5 });
    });
  });

  describe('of a date picker', () => {
    beforeAll(() => useMatcher(by.id('attrDatePicker')));

    it(':ios: should have Date .value', () => {
      expect(attributes).toMatchObject({
        date: expect.stringMatching(/^2022-01-01T00:00:00([+-]\d{2}:\d{2}|Z)$/),
      });
    });
  });

  describe('of a legacy scroll view', () => {
    it(':ios: @legacy should have offsets and insets', async () => {
      await useMatcher(by.type('RCTCustomScrollView').withAncestor(by.id('attrScrollView')));

      expect(attributes).toMatchObject({
        contentOffset: shapes.Point2D(),
        contentInset: shapes.IosElementAttributesInsets(),
        adjustedContentInset: shapes.IosElementAttributesInsets(),
      });
    });
  });

  describe('of a new arch scroll view', () => {
    it(':ios: @new-arch should have offsets and insets', async () => {
      await useMatcher(by.id('attrScrollView'));

      expect(attributes).toMatchObject({
        contentOffset: shapes.Point2D(),
        contentInset: shapes.IosElementAttributesInsets(),
        adjustedContentInset: shapes.IosElementAttributesInsets(),
      });
    });
  });

  describe('of multiple views', () => {
    it(':ios: @legacy should return an object with .elements array', async () => {
      await useMatcher(by.type('RCTView').withAncestor(by.id('attrScrollView')));

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
      expect(innerViews[0]).toMatchObject({ ...viewShape });
      expect(innerViews[1]).toMatchObject({ ...viewShape });
    });

    it(':ios: @new-arch should return an object with .elements array', async () => {
      await useMatcher(by.type('RCTViewComponentView'));

      const innerViews = attributesArray.filter(a => a.identifier);
      expect(innerViews.length).toBeGreaterThan(1);
    });

    it(':android: should return an object with .elements array', async () => {
      await useMatcher(by.type('com.facebook.react.views.view.ReactViewGroup').withAncestor(by.id('attrScrollView')));

      expect(attributesArray.length).toBe(3);

      const baseAttributes = {
        visibility: 'visible',
        visible: true,
        alpha: 1,
        elevation: 0,
        focused: false,
        enabled: true,
      };

      expect(attributesArray[0]).toMatchObject({
        ...{
          height: 412,
          width: 1074,
        },
        ...baseAttributes
      });

      expect(attributesArray[1]).toMatchObject({
        ...{
          height: 206,
          width: 275,
          identifier: 'innerView1'
        },
        ...baseAttributes
      });

      expect(attributesArray[2]).toMatchObject({
        ...{
          height: 206,
          width: 275,
          identifier: 'innerView2'
        },
        ...baseAttributes
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
