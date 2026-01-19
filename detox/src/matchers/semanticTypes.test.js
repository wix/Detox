const semanticTypes = require('./semanticTypes');

describe('semanticTypes', () => {
  const testMatrix = [];
  const semanticTypeList = semanticTypes.getTypes();
  const platforms = ['ios', 'android'];

  describe('getClasses', () => {

    semanticTypeList.forEach(semanticType => {
      platforms.forEach(platform => {
        testMatrix.push([semanticType, platform]);
      });
    });

    test.each(testMatrix)('should return class names for %s on %s', (semanticType, platform) => {
      const classNames = semanticTypes.getClasses(semanticType, platform);
      expect(classNames).toMatchSnapshot(`${semanticType}-${platform}`);
    });

    it('should return fallback for unknown semantic type', () => {
      const classNames = semanticTypes.getClasses('unknown-type', 'ios');
      expect(classNames).toEqual([{ className: 'unknown-type', excludes: [] }]);
    });

    it('should throw error for unsupported platform', () => {
      expect(() => {
        semanticTypes.getClasses('image', 'windows');
      }).toThrow('Platform windows not supported for semantic type image');
    });

    it('should return same classes for progress and activity-indicator', () => {
      platforms.forEach(platform => {
        expect(semanticTypes.getClasses('progress', platform)).toEqual(
          semanticTypes.getClasses('activity-indicator', platform)
        );
      });
    });

    it('should handle exclusion objects correctly', () => {
      const classNames = semanticTypes.getClasses('activity-indicator', 'android');

      expect(classNames).toHaveLength(2);
      expect(classNames[0]).toHaveProperty('className', 'android.widget.ProgressBar');
      expect(classNames[0]).toHaveProperty('excludes', ['android.widget.AbsSeekBar']);
      expect(classNames[1]).toHaveProperty('className', 'androidx.core.widget.ContentLoadingProgressBar');
      expect(classNames[1]).toHaveProperty('excludes', ['android.widget.AbsSeekBar']);
    });

    it('should handle text exclusions to prevent EditText and Button conflicts', () => {
      const classNames = semanticTypes.getClasses('text', 'android');

      expect(classNames).toHaveLength(2);
      expect(classNames[0]).toHaveProperty('className', 'android.widget.TextView');
      expect(classNames[0]).toHaveProperty('excludes', ['android.widget.EditText', 'android.widget.Button']);
      expect(classNames[1]).toHaveProperty('className', 'com.facebook.react.views.text.ReactTextView');
      expect(classNames[1]).toHaveProperty('excludes', ['android.widget.EditText', 'android.widget.Button']);
    });

    it('should handle single string include with exclusions', () => {
      semanticTypes.SEMANTIC_TYPE_MAPPINGS['test-single'] = {
        android: [{
          include: 'android.widget.TestView',
          exclude: ['android.widget.ExcludedView']
        }]
      };

      const classNames = semanticTypes.getClasses('test-single', 'android');

      expect(classNames).toHaveLength(1);
      expect(classNames[0]).toHaveProperty('className', 'android.widget.TestView');
      expect(classNames[0]).toHaveProperty('excludes', ['android.widget.ExcludedView']);

      delete semanticTypes.SEMANTIC_TYPE_MAPPINGS['test-single'];
    });

    it('should handle unexpected item types gracefully', () => {
      semanticTypes.SEMANTIC_TYPE_MAPPINGS['test-fallback'] = {
        android: [{ unexpectedProperty: 'someValue' }]
      };

      const classNames = semanticTypes.getClasses('test-fallback', 'android');

      expect(classNames).toHaveLength(1);
      expect(classNames[0]).toHaveProperty('className');
      expect(classNames[0]).toHaveProperty('excludes', []);

      delete semanticTypes.SEMANTIC_TYPE_MAPPINGS['test-fallback'];
    });
  });

  describe('getTypes', () => {
    it('should return all semantic types from mappings', () => {
      const types = semanticTypes.getTypes();
      const mappingKeys = Object.keys(semanticTypes.SEMANTIC_TYPE_MAPPINGS);
      expect(types).toEqual(mappingKeys);
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
      semanticTypeList.forEach(semanticType => {
        expect(semanticTypes.includes(semanticType)).toBe(true);
      });
    });

    it('should return false for invalid semantic types', () => {
      expect(semanticTypes.includes('unknown-type')).toBe(false);
      expect(semanticTypes.includes('')).toBe(false);

      const buttonClasses = semanticTypes.getClasses('button', 'ios');
      const imageClasses = semanticTypes.getClasses('image', 'android');

      buttonClasses.forEach(item => {
        expect(semanticTypes.includes(item.className)).toBe(false);
      });

      imageClasses.forEach(item => {
        expect(semanticTypes.includes(item.className)).toBe(false);
      });
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

        expect(androidClassNames.length).toBeGreaterThan(0);
        expect(iosClassNames.length).toBeGreaterThan(0);

        [...androidClassNames, ...iosClassNames].forEach(item => {
          expect(item).toHaveProperty('className');
          expect(item).toHaveProperty('excludes');
          expect(typeof item.className).toBe('string');
          expect(item.className.length).toBeGreaterThan(0);
          expect(Array.isArray(item.excludes)).toBe(true);
          item.excludes.forEach(excludeClass => {
            expect(typeof excludeClass).toBe('string');
            expect(excludeClass.length).toBeGreaterThan(0);
          });
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
