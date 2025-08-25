// @ts-nocheck
const semanticTypes = require('./semanticTypes');

describe('semanticTypes', () => {
  describe('getClasses', () => {
    it('should return iOS class names for image type', () => {
      const classNames = semanticTypes.getClasses('image', 'ios');
      expect(classNames).toEqual(['RCTImageView', 'UIImageView']);
    });

    it('should return Android class names for image type', () => {
      const classNames = semanticTypes.getClasses('image', 'android');
      expect(classNames).toEqual(['android.widget.ImageView', 'com.facebook.react.views.image.ReactImageView']);
    });

    it('should return iOS class names for input-field type', () => {
      const classNames = semanticTypes.getClasses('input-field', 'ios');
      expect(classNames).toEqual(['RCTTextInputView', 'RCTMultilineTextInputView', 'UITextField', 'UITextView']);
    });

    it('should return Android class names for input-field type', () => {
      const classNames = semanticTypes.getClasses('input-field', 'android');
      expect(classNames).toEqual(['android.widget.EditText', 'com.facebook.react.views.textinput.ReactEditText']);
    });

    it('should throw error for unknown semantic type', () => {
      expect(() => {
        semanticTypes.getClasses('unknown-type', 'ios');
      }).toThrow('Unknown semantic type: unknown-type');
    });

    it('should throw error for unsupported platform', () => {
      expect(() => {
        semanticTypes.getClasses('image', 'windows');
      }).toThrow('Platform windows not supported for semantic type image');
    });

    it('should return iOS class names for scrollview type', () => {
      const classNames = semanticTypes.getClasses('scrollview', 'ios');
      expect(classNames).toEqual(['RCTScrollView', 'UIScrollView']);
    });

    it('should return Android class names for scrollview type', () => {
      const classNames = semanticTypes.getClasses('scrollview', 'android');
      expect(classNames).toEqual([
        'android.widget.ScrollView',
        'androidx.core.widget.NestedScrollView',
        'com.facebook.react.views.scroll.ReactScrollView'
      ]);
    });

    it('should return iOS class names for progress type', () => {
      const classNames = semanticTypes.getClasses('progress', 'ios');
      expect(classNames).toEqual(['UIActivityIndicatorView']);
    });

    it('should return Android class names for progress type', () => {
      const classNames = semanticTypes.getClasses('progress', 'android');
      expect(classNames).toEqual(['android.widget.ProgressBar', 'androidx.core.widget.ContentLoadingProgressBar']);
    });

    it('should return same classes for progress and activity-indicator', () => {
      expect(semanticTypes.getClasses('progress', 'ios')).toEqual(
        semanticTypes.getClasses('activity-indicator', 'ios')
      );
      expect(semanticTypes.getClasses('progress', 'android')).toEqual(
        semanticTypes.getClasses('activity-indicator', 'android')
      );
    });
  });

  describe('getTypes', () => {
    it('should return all available semantic types', () => {
      const types = semanticTypes.getTypes();
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
        'activity-indicator',
        'progress'
      ]);
    });

    it('should return an array', () => {
      const types = semanticTypes.getTypes();
      expect(Array.isArray(types)).toBe(true);
    });

    it('should not be empty', () => {
      const types = semanticTypes.getTypes();
      expect(types.length).toBeGreaterThan(0);
    });
  });

  describe('includes', () => {
    it('should return true for valid semantic types', () => {
      expect(semanticTypes.includes('image')).toBe(true);
      expect(semanticTypes.includes('button')).toBe(true);
      expect(semanticTypes.includes('input-field')).toBe(true);
      expect(semanticTypes.includes('text')).toBe(true);
      expect(semanticTypes.includes('progress')).toBe(true);
      expect(semanticTypes.includes('activity-indicator')).toBe(true);
    });

    it('should return false for invalid semantic types', () => {
      expect(semanticTypes.includes('unknown-type')).toBe(false);
      expect(semanticTypes.includes('UIButton')).toBe(false);
      expect(semanticTypes.includes('com.example.CustomView')).toBe(false);
      expect(semanticTypes.includes('')).toBe(false);
    });

    it('should return false for non-string values', () => {
      expect(semanticTypes.includes(null)).toBe(false);
      expect(semanticTypes.includes(undefined)).toBe(false);
      expect(semanticTypes.includes(123)).toBe(false);
      expect(semanticTypes.includes({})).toBe(false);
      expect(semanticTypes.includes([])).toBe(false);
    });
  });

  describe('cross-platform validation', () => {
    it('should ensure all semantic types have valid class names for both platforms', () => {
      const allSemanticTypes = semanticTypes.getTypes();
      allSemanticTypes.forEach(semanticType => {
        const androidClassNames = semanticTypes.getClasses(semanticType, 'android');
        const iosClassNames = semanticTypes.getClasses(semanticType, 'ios');

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
      expect(semanticTypes.getTypes().includes('image')).toBe(true);
      expect(semanticTypes.getTypes().includes('button')).toBe(true);
      expect(semanticTypes.getTypes().includes('com.example.CustomView')).toBe(false);
      expect(semanticTypes.getTypes().includes('UIButton')).toBe(false);
    });
  });
});
