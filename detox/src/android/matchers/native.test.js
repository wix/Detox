// Mock the semanticTypes module before importing anything that depends on it
jest.mock('../../utils/semanticTypes', () => ({
  getAvailableSemanticTypes: jest.fn(),
  getClassNamesForSemanticType: jest.fn()
}));


const DetoxRuntimeError = require('../../errors/DetoxRuntimeError');
const semanticTypes = require('../../utils/semanticTypes');

const { TypeMatcher } = require('./native');

describe('Native Matchers', () => {
  describe('TypeMatcher', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should throw error when semantic type has no class names', () => {
      // Mock getAvailableSemanticTypes to include a test semantic type
      semanticTypes.getAvailableSemanticTypes.mockReturnValue(['test-semantic-type']);
      
      // Mock getClassNamesForSemanticType to return empty array
      semanticTypes.getClassNamesForSemanticType.mockReturnValue([]);

      expect(() => {
        new TypeMatcher('test-semantic-type');
      }).toThrow(DetoxRuntimeError);
      
      expect(() => {
        new TypeMatcher('test-semantic-type');
      }).toThrow('No class names found for semantic type: test-semantic-type');
    });

    it('should handle regular class names when not a semantic type', () => {
      // Mock getAvailableSemanticTypes to not include the test class
      semanticTypes.getAvailableSemanticTypes.mockReturnValue([]);
      
      // Should not throw and should work with regular class names
      expect(() => {
        new TypeMatcher('com.example.CustomView');
      }).not.toThrow();
    });

    it('should handle semantic types with valid class names', () => {
      // Mock getAvailableSemanticTypes to include a test semantic type
      semanticTypes.getAvailableSemanticTypes.mockReturnValue(['image']);
      
      // Mock getClassNamesForSemanticType to return valid class names
      semanticTypes.getClassNamesForSemanticType.mockReturnValue([
        'android.widget.ImageView',
        'com.facebook.react.views.image.ReactImageView'
      ]);

      expect(() => {
        new TypeMatcher('image');
      }).not.toThrow();
    });
  });
}); 