const globals = require('../core/global-functions');

describe('globals', () => {
  describe('sanitize_android_direction', () => {
    it('should return numbers for strings', () => {
      expect(globals.sanitize_android_direction('left')).toBe(1);
      expect(globals.sanitize_android_direction('right')).toBe(2);
      expect(globals.sanitize_android_direction('up')).toBe(3);
      expect(globals.sanitize_android_direction('down')).toBe(4);
    });

    it('should fail with unknown value', () => {
      expect(() => {
        globals.sanitize_android_direction('kittens');
      }).toThrowErrorMatchingSnapshot();
    });
  });

  describe('sanitize_android_edge', () => {
    it('should return numbers for strings', () => {
      expect(globals.sanitize_android_edge('left')).toBe(1);
      expect(globals.sanitize_android_edge('right')).toBe(2);
      expect(globals.sanitize_android_edge('top')).toBe(3);
      expect(globals.sanitize_android_edge('bottom')).toBe(4);
    });

    it('should fail with unknown value', () => {
      expect(() => {
        globals.sanitize_android_edge('kittens');
      }).toThrowErrorMatchingSnapshot();
    });
  });

  describe('sanitize_greyDirection', () => {
    it('should return numbers for strings', () => {
      expect(globals.sanitize_greyDirection('left')).toBe(1);
      expect(globals.sanitize_greyDirection('right')).toBe(2);
      expect(globals.sanitize_greyDirection('up')).toBe(3);
      expect(globals.sanitize_greyDirection('down')).toBe(4);
    });

    it('should fail with unknown value', () => {
      expect(() => {
        globals.sanitize_greyDirection('kittens');
      }).toThrowErrorMatchingSnapshot();
    });
  });
  describe('sanitize_greyPinchDirection', () => {
    it('should return numbers for strings', () => {
      expect(globals.sanitize_greyPinchDirection('outward')).toBe(1);
      expect(globals.sanitize_greyPinchDirection('inward')).toBe(2);
    });

    it('should fail with unknown value', () => {
      expect(() => {
        globals.sanitize_greyPinchDirection('kittens');
      }).toThrowErrorMatchingSnapshot();
    });
  });

  describe('sanitize_greyContentEdge', () => {
    it('should return numbers for strings', () => {
      expect(globals.sanitize_greyContentEdge('left')).toBe(0);
      expect(globals.sanitize_greyContentEdge('right')).toBe(1);
      expect(globals.sanitize_greyContentEdge('top')).toBe(2);
      expect(globals.sanitize_greyContentEdge('bottom')).toBe(3);
    });

    it('should fail with unknown value', () => {
      expect(() => {
        globals.sanitize_greyContentEdge('kittens');
      }).toThrowErrorMatchingSnapshot();
    });
  });

  describe('sanitize_uiAccessibilityTraits', () => {
    it('should return numbers for traits', () => {
      expect(globals.sanitize_uiAccessibilityTraits(['button'])).toBe(1);
      expect(globals.sanitize_uiAccessibilityTraits(['image'])).toBe(4);
      expect(globals.sanitize_uiAccessibilityTraits(['header'])).toBe(65536);

      [
        'button',
        'link',
        'header',
        'search',
        'image',
        'selected',
        'plays',
        'key',
        'text',
        'summary',
        'disabled',
        'frequentUpdates',
        'startsMedia',
        'adjustable',
        'allowsDirectInteraction',
        'pageTurn'
      ].forEach((trait) => {
        expect(typeof globals.sanitize_uiAccessibilityTraits([trait])).toBe('number');
      });
    });
    it('should combine the traits', () => {
      expect(globals.sanitize_uiAccessibilityTraits(['summary', 'allowsDirectInteraction'])).toBe(8320);
    });

    it('should throw if unknown trait is accessed', () => {
      expect(() => globals.sanitize_uiAccessibilityTraits(['unknown'])).toThrowErrorMatchingSnapshot();
    });
  });

  const matcherInvocation = {
    target: { type: 'Class', value: 'Detox.Matcher' },
    method: 'matchNicely'
  };
  describe('sanitize_matcher', () => {
    it("should return the object if it's no function", () => {
      expect(globals.sanitize_matcher({ _call: matcherInvocation })).toEqual(matcherInvocation);
    });

    it("should return the ._call property if it's a function", () => {
      const matcherLikeObj = { _call: () => matcherInvocation };
      expect(globals.sanitize_matcher(matcherLikeObj)).toEqual(matcherInvocation);
    });

    it("should unwrap the object if it's in an invocation", () => {
      const invoke = { type: 'Invocation', value: matcherInvocation };
      const invokeCalled = { _call: invoke };
      const invokeThunk = { _call: () => invoke };

      expect(globals.sanitize_matcher(invokeCalled)).toEqual(matcherInvocation);
      expect(globals.sanitize_matcher(invokeThunk)).toEqual(matcherInvocation);
    });

    it('should not call on string', () => {
      const matcherLikeObj = {
        _call: 'I am a call'
      };
      expect(globals.sanitize_matcher(matcherLikeObj)).toBe('I am a call');
    });

    it('should not get _call property if it is not present', () => {
      const unwrappedMatcher = 'I am a call';
      expect(globals.sanitize_matcher(unwrappedMatcher)).toBe('I am a call');
    });
  });

  describe('sanitize_greyElementInteraction', () => {
    it('should wrap the argument in an invocation', () => {
      expect(globals.sanitize_greyElementInteraction('Foo')).toEqual({
        type: 'Invocation',
        value: 'Foo'
      });
    });
  });
});
