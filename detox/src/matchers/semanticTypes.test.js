// @ts-nocheck
const { getClassNamesForSemanticType, getAvailableSemanticTypes } = require('./semanticTypes');

describe('semanticTypes', () => {
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
      expect(classNames).toEqual(['RCTTextInputView', 'RCTMultilineTextInputView', 'UITextField', 'UITextView']);
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

  describe('cross-platform validation', () => {
    it('should ensure all semantic types have valid class names for both platforms', () => {
      const allSemanticTypes = getAvailableSemanticTypes();
      allSemanticTypes.forEach(semanticType => {
        const androidClassNames = getClassNamesForSemanticType(semanticType, 'android');
        const iosClassNames = getClassNamesForSemanticType(semanticType, 'ios');

        // Both platforms should always return at least one class name
        expect(androidClassNames.length).toBeGreaterThan(0);
        expect(iosClassNames.length).toBeGreaterThan(0);

        // All class names should be non-empty strings
        [...androidClassNames, ...iosClassNames].forEach(className => {
          expect(typeof className).toBe('string');
          expect(className.length).toBeGreaterThan(0);
        });
      });
    });

    it('should differentiate between semantic types and regular class names', () => {
      expect(getAvailableSemanticTypes().includes('image')).toBe(true);
      expect(getAvailableSemanticTypes().includes('button')).toBe(true);
      expect(getAvailableSemanticTypes().includes('com.example.CustomView')).toBe(false);
      expect(getAvailableSemanticTypes().includes('UIButton')).toBe(false);
    });
  });
});
