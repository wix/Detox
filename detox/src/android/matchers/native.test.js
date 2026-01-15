// @ts-nocheck
jest.mock('../../matchers/semanticTypes', () => ({
  getTypes: jest.fn(),
  getClasses: jest.fn(),
  includes: jest.fn()
}));


const semanticTypes = require('../../matchers/semanticTypes');

const { TypeMatcher } = require('./native');

describe('Native Matchers', () => {
  describe('TypeMatcher', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should handle regular class names', () => {
      semanticTypes.includes.mockReturnValue(false);
      
      expect(() => {
        new TypeMatcher('com.example.CustomView');
      }).not.toThrow();
    });

    it('should handle semantic types automatically', () => {
      semanticTypes.includes.mockReturnValue(true);
      semanticTypes.getClasses.mockReturnValue([
        'android.widget.ImageView',
        'com.facebook.react.views.image.ReactImageView'
      ]);

      expect(() => {
        new TypeMatcher('image');
      }).not.toThrow();
    });

    it('should handle exclusion objects for semantic types', () => {
      semanticTypes.includes.mockReturnValue(true);
      semanticTypes.getClasses.mockReturnValue([
        {
          className: 'android.widget.ProgressBar',
          excludes: ['android.widget.AbsSeekBar']
        },
        {
          className: 'androidx.core.widget.ContentLoadingProgressBar',
          excludes: ['android.widget.AbsSeekBar']
        }
      ]);

      expect(() => {
        new TypeMatcher('activity-indicator');
      }).not.toThrow();
    });

    it('should handle mixed string and exclusion objects', () => {
      semanticTypes.includes.mockReturnValue(true);
      semanticTypes.getClasses.mockReturnValue([
        {
          className: 'android.widget.ProgressBar',
          excludes: ['android.widget.AbsSeekBar']
        },
        {
          className: 'androidx.core.widget.ContentLoadingProgressBar',
          excludes: ['android.widget.AbsSeekBar']
        }
      ]);

      expect(() => {
        new TypeMatcher('progress');
      }).not.toThrow();
    });

    it('should handle regular class names when not semantic types', () => {
      semanticTypes.includes.mockReturnValue(false);

      expect(() => {
        new TypeMatcher('android.widget.ImageView');
      }).not.toThrow();
    });
  });
});
