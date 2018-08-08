const fs = require('fs');
const remove = require('remove');
const androidGenerator = require('../adapters/android');

// We have to separate jest contexts, therfore we need to do this manually
const mockLogger = require('../../detox/src/utils/__mocks__/logger');
jest.mock('../../detox/src/utils/logger', () => mockLogger);

describe('Android generation', () => {
  let ExampleClass;
  let exampleContent;
  beforeAll(() => {
    // Generate the code to test
    fs.mkdirSync('./__tests__/generated-android');

    const files = {
      './fixtures/example.java': './__tests__/generated-android/example.js'
    };

    console.log('==> generating android files');
    androidGenerator(files);

    console.log('==> loading android files');
    // Load
    ExampleClass = require('./generated-android/example.js');
    exampleContent = fs.readFileSync('./__tests__/generated-android/example.js', 'utf8');
  });

  afterAll(() => {
    // Clean up
    remove.removeSync('./__tests__/generated-android');
  });

  describe('methods', () => {
    it('should expose the functions', () => {
      expect(ExampleClass.multiClick).toBeInstanceOf(Function);
    });

    it('should generate type checks', () => {
      expect(() => {
        ExampleClass.multiClick('FOO');
      }).toThrowErrorMatchingSnapshot();
    });

    it('should return adapter calls', () => {
      const result = ExampleClass.multiClick(3);
      expect(result.method).toBe('multiClick');
      expect(result.target.value).toBe('com.wix.detox.espresso.DetoxAction');
      expect(result.args[0].type).toBe('Integer');
      expect(result.args[0].value).toBe(3);

      expect(result).toMatchSnapshot();
    });

    it('should add a sanitizer for the function with the correct name', () => {
      const fn = ExampleClass.scrollInDirection;

      expect(() => {
        fn(3, 42);
      }).toThrowError();

      expect(() => {
        fn('down', 42);
      }).not.toThrowError();

      expect(fn('down', 42)).toMatchSnapshot();
    });
  });

  describe('validation', () => {
    describe('Matcher<View>', () => {
      it('should log that it gets no object', () => {
        expect(() => {
          ExampleClass.matcherForAnd('I am a string', 'I am one too');
        }).not.toThrow();

        expect(mockLogger.error).toHaveBeenCalledWith(expect.any(Object), expect.any(String));
      });

      it('should log with a wrong class', () => {
        class AnotherClass {}
        const x = new AnotherClass();

        expect(() => {
          ExampleClass.matcherForAnd(x, x);
        }).not.toThrow();

        expect(mockLogger.error).toHaveBeenCalledWith(expect.any(Object), expect.any(String));
      });

      it("should succeed with the 'right' class", () => {
        // stub for matcher class
        class Matcher {
          _call() {
            return {
              target: { type: 'Class', value: 'Detox.Matcher' },
              method: 'matchNicely'
            };
          }
        }

        const m = new Matcher();
        expect(() => {
          ExampleClass.matcherForAnd(m, m);
        }).not.toThrow();
      });
    });
  });
});
