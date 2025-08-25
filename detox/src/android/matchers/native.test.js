// @ts-nocheck
// Mock the semanticTypes module before importing anything that depends on it
jest.mock('../../matchers/semanticTypes', () => ({
  getAvailableSemanticTypes: jest.fn(),
  getClassNamesForSemanticType: jest.fn()
}));


const DetoxRuntimeError = require('../../errors/DetoxRuntimeError');
const semanticTypes = require('../../matchers/semanticTypes');

const { TypeMatcher, SemanticTypeMatcher } = require('./native');

describe('Native Matchers', () => {
  describe('TypeMatcher', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should handle regular class names', () => {
      // TypeMatcher now only handles regular class names, no semantic type logic
      expect(() => {
        new TypeMatcher('com.example.CustomView');
      }).not.toThrow();
    });

    it('should handle any string as a class name', () => {
      // TypeMatcher treats any string as a class name (no semantic type detection)
      expect(() => {
        new TypeMatcher('image');
      }).not.toThrow();
      
      expect(() => {
        new TypeMatcher('android.widget.ImageView');
      }).not.toThrow();
    });
  });

  describe('SemanticTypeMatcher', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should throw error for unknown semantic type', () => {
      // Mock getAvailableSemanticTypes to not include unknown type
      semanticTypes.getAvailableSemanticTypes.mockReturnValue(['image', 'button']);
      
      expect(() => {
        new SemanticTypeMatcher('unknown-type');
      }).toThrow(DetoxRuntimeError);
      
      expect(() => {
        new SemanticTypeMatcher('unknown-type');
      }).toThrow('Unknown semantic type: unknown-type. Available types: image, button');
    });

    it('should throw error when semantic type has no class names', () => {
      // Mock getAvailableSemanticTypes to include the test semantic type
      semanticTypes.getAvailableSemanticTypes.mockReturnValue(['test-semantic-type']);
      
      // Mock getClassNamesForSemanticType to return empty array
      semanticTypes.getClassNamesForSemanticType.mockReturnValue([]);

      expect(() => {
        new SemanticTypeMatcher('test-semantic-type');
      }).toThrow(DetoxRuntimeError);
      
      expect(() => {
        new SemanticTypeMatcher('test-semantic-type');
      }).toThrow('No class names found for semantic type: test-semantic-type');
    });

    it('should handle valid semantic types with multiple class names', () => {
      // Mock getAvailableSemanticTypes to include image type
      semanticTypes.getAvailableSemanticTypes.mockReturnValue(['image']);
      
      // Mock getClassNamesForSemanticType to return valid class names
      semanticTypes.getClassNamesForSemanticType.mockReturnValue([
        'android.widget.ImageView',
        'com.facebook.react.views.image.ReactImageView'
      ]);

      expect(() => {
        new SemanticTypeMatcher('image');
      }).not.toThrow();
    });

    it('should validate semantic type strictly without fallback', () => {
      // Mock getAvailableSemanticTypes to not include regular class names
      semanticTypes.getAvailableSemanticTypes.mockReturnValue(['image', 'button']);
      
      // Should throw for regular class names (no fallback like TypeMatcher)
      expect(() => {
        new SemanticTypeMatcher('com.example.CustomView');
      }).toThrow(DetoxRuntimeError);
      
      expect(() => {
        new SemanticTypeMatcher('com.example.CustomView');
      }).toThrow('Unknown semantic type: com.example.CustomView. Available types: image, button');
    });
  });
}); 