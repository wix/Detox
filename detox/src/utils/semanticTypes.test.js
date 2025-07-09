const { getClassNamesForSemanticType, getAvailableSemanticTypes } = require('./semanticTypes');

describe('Enhanced by.type() with semantic types', () => {
  describe('getClassNamesForSemanticType', () => {
    it('should return iOS class names for image type', () => {
      const classNames = getClassNamesForSemanticType('image', 'ios');
      expect(classNames).toEqual(['RCTImageView', 'UIImageView']);
    });

    it('should return Android class names for image type', () => {
      const classNames = getClassNamesForSemanticType('image', 'android');
      expect(classNames).toEqual(['android.widget.ImageView', 'com.facebook.react.views.image.ReactImageView']);
    });

    it('should return iOS class names for input-field type', () => {
      const classNames = getClassNamesForSemanticType('input-field', 'ios');
      expect(classNames).toEqual(['RCTTextInput', 'RCTMultilineTextInput', 'UITextField', 'UITextView']);
    });

    it('should return Android class names for input-field type', () => {
      const classNames = getClassNamesForSemanticType('input-field', 'android');
      expect(classNames).toEqual(['android.widget.EditText', 'com.facebook.react.views.textinput.ReactEditText']);
    });

    it('should throw error for unknown semantic type', () => {
      expect(() => {
        getClassNamesForSemanticType('unknown-type', 'ios');
      }).toThrow('Unknown semantic type: unknown-type');
    });

    it('should throw error for unsupported platform', () => {
      expect(() => {
        getClassNamesForSemanticType('image', 'windows');
      }).toThrow('Platform windows not supported for semantic type image');
    });

    it('should return iOS class names for scrollview type', () => {
      const classNames = getClassNamesForSemanticType('scrollview', 'ios');
      expect(classNames).toEqual(['RCTScrollView', 'UIScrollView']);
    });

    it('should return Android class names for scrollview type', () => {
      const classNames = getClassNamesForSemanticType('scrollview', 'android');
      expect(classNames).toEqual([
        'android.widget.ScrollView',
        'androidx.core.widget.NestedScrollView',
        'com.facebook.react.views.scroll.ReactScrollView'
      ]);
    });
  });

  describe('getAvailableSemanticTypes', () => {
    it('should return all available semantic types', () => {
      const types = getAvailableSemanticTypes();
      expect(types).toEqual([
        'image',
        'input-field',
        'text',
        'button',
        'scrollview',
        'list',
        'switch',
        'slider',
        'picker',
        'activity-indicator'
      ]);
    });

    it('should return an array', () => {
      const types = getAvailableSemanticTypes();
      expect(Array.isArray(types)).toBe(true);
    });

    it('should not be empty', () => {
      const types = getAvailableSemanticTypes();
      expect(types.length).toBeGreaterThan(0);
    });
  });

  describe('Integration with TypeMatcher (Android)', () => {
    // Test the logic flow by simulating the matcher behavior
    it('should differentiate between semantic types and regular class names', () => {
      // Test semantic type detection
      expect(getAvailableSemanticTypes().includes('image')).toBe(true);
      expect(getAvailableSemanticTypes().includes('com.example.CustomView')).toBe(false);

      // Test that semantic types have multiple class names
      const imageClassNames = getClassNamesForSemanticType('image', 'android');
      expect(imageClassNames.length).toBeGreaterThan(1);
      expect(imageClassNames).toContain('android.widget.ImageView');
      expect(imageClassNames).toContain('com.facebook.react.views.image.ReactImageView');
    });

    it('should handle semantic type with minimum class names correctly', () => {
      // Test a semantic type that has the minimum number of class names (2)
      const imageClassNames = getClassNamesForSemanticType('image', 'android');
      expect(imageClassNames.length).toBe(2);
      expect(imageClassNames).toContain('android.widget.ImageView');
      expect(imageClassNames).toContain('com.facebook.react.views.image.ReactImageView');
    });

    it('should handle multiple class names for scrollview', () => {
      // Test that scrollview has multiple class names for Android
      const scrollviewClassNames = getClassNamesForSemanticType('scrollview', 'android');
      expect(scrollviewClassNames.length).toBeGreaterThan(1);
      expect(scrollviewClassNames).toContain('android.widget.ScrollView');
      expect(scrollviewClassNames).toContain('com.facebook.react.views.scroll.ReactScrollView');
    });

    it('should validate that all semantic types have valid class names', () => {
      // Ensure all semantic types return valid class names for Android
      const allSemanticTypes = getAvailableSemanticTypes();
      allSemanticTypes.forEach(semanticType => {
        const classNames = getClassNamesForSemanticType(semanticType, 'android');
        expect(classNames.length).toBeGreaterThan(0);
        classNames.forEach(className => {
          expect(typeof className).toBe('string');
          expect(className.length).toBeGreaterThan(0);
        });
      });
    });

    it('should ensure null check protection exists', () => {
      // Test that the utility function never returns empty arrays for valid semantic types
      // This ensures our null check in TypeMatcher is safe
      const allSemanticTypes = getAvailableSemanticTypes();
      allSemanticTypes.forEach(semanticType => {
        const androidClassNames = getClassNamesForSemanticType(semanticType, 'android');
        const iosClassNames = getClassNamesForSemanticType(semanticType, 'ios');

        // Both platforms should always return at least one class name
        expect(androidClassNames.length).toBeGreaterThan(0);
        expect(iosClassNames.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Integration with Matcher.type() (iOS)', () => {
    // Simple mock for iOS Matcher class that replicates the actual logic
    class MockMatcher {
      constructor() {
        this.predicate = null;
      }

      type(type) {
        if (typeof type !== 'string') throw new Error('type should be a string, but got ' + (type + (' (' + (typeof type + ')'))));

        // Check if it's a known semantic type first
        if (getAvailableSemanticTypes().includes(type)) {
          // It's a semantic type
          const classNames = getClassNamesForSemanticType(type, 'ios');
          const predicates = classNames.map(className => ({ type: 'type', value: className }));
          this.predicate = { type: 'or', predicates };
        } else {
          // Not a semantic type, treat as regular class name
          this.predicate = { type: 'type', value: type };
        }

        return this;
      }
    }

    it('should handle semantic types with multiple class names correctly', () => {
      const matcher = new MockMatcher();
      matcher.type('image');

      // Should create OR predicate with multiple class names
      const expectedClassNames = getClassNamesForSemanticType('image', 'ios');
      expect(expectedClassNames.length).toBeGreaterThan(1); // Ensure it's actually multiple
      expect(matcher.predicate).toEqual({
        type: 'or',
        predicates: expectedClassNames.map(className => ({ type: 'type', value: className }))
      });
    });

    it('should handle semantic types with minimum class names correctly', () => {
      const matcher = new MockMatcher();
      matcher.type('image');

      // Should create OR predicate even for minimum class names
      const expectedClassNames = getClassNamesForSemanticType('image', 'ios');
      expect(expectedClassNames.length).toBe(2); // Ensure it has minimum class names
      expect(matcher.predicate).toEqual({
        type: 'or',
        predicates: expectedClassNames.map(className => ({ type: 'type', value: className }))
      });
    });

    it('should handle scrollview with multiple class names correctly', () => {
      const matcher = new MockMatcher();
      matcher.type('scrollview');

      // Should create OR predicate with multiple class names
      const expectedClassNames = getClassNamesForSemanticType('scrollview', 'ios');
      expect(expectedClassNames.length).toBeGreaterThan(1); // Ensure it's actually multiple
      expect(matcher.predicate).toEqual({
        type: 'or',
        predicates: expectedClassNames.map(className => ({ type: 'type', value: className }))
      });
    });

    it('should handle regular class names correctly', () => {
      const matcher = new MockMatcher();
      matcher.type('CustomUIView');

      // Should create simple type predicate for non-semantic types
      expect(matcher.predicate).toEqual({
        type: 'type',
        value: 'CustomUIView'
      });
    });

    it('should validate that all semantic types work with iOS logic', () => {
      // Test all semantic types to ensure they work with the iOS implementation
      const allSemanticTypes = getAvailableSemanticTypes();
      allSemanticTypes.forEach(semanticType => {
        const matcher = new MockMatcher();
        matcher.type(semanticType);

        // Should always create an OR predicate for semantic types
        expect(matcher.predicate.type).toBe('or');
        expect(Array.isArray(matcher.predicate.predicates)).toBe(true);
        expect(matcher.predicate.predicates.length).toBeGreaterThan(0);

        // All predicates should be type predicates with valid class names
        matcher.predicate.predicates.forEach(predicate => {
          expect(predicate.type).toBe('type');
          expect(typeof predicate.value).toBe('string');
          expect(predicate.value.length).toBeGreaterThan(0);
        });
      });
    });

    it('should handle scrollview semantic type correctly', () => {
      const scrollviewMatcher = new MockMatcher();
      scrollviewMatcher.type('scrollview');

      // Should create OR predicate for scrollview
      expect(scrollviewMatcher.predicate.type).toBe('or');
      expect(scrollviewMatcher.predicate.predicates).toEqual([
        { type: 'type', value: 'RCTScrollView' },
        { type: 'type', value: 'UIScrollView' }
      ]);
    });
  });
});