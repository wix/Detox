const fs = require("fs");
const remove = require("remove");
const earlGreyGenerator = require("../earl-grey");

describe("earl-grey generation", () => {
  let ExampleClass;
  let exampleContent;
  beforeAll(() => {
    // Generate the code to test
    fs.mkdirSync("./__tests__/generated");

    const files = {
      "./fixtures/example.h": "./__tests__/generated/example.js"
    };

    console.log('==> generating earl grey files');
    earlGreyGenerator(files);

    console.log('==> loading earl grey files');
    // Load
    ExampleClass = require("./generated/example.js");
    exampleContent = fs.readFileSync(
      "./__tests__/generated/example.js",
      "utf8"
    );
  });

  it("should export the class", () => {
    expect(ExampleClass.actionForMultipleTapsWithCount).toBeInstanceOf(
      Function
    );
  });

  describe("Comments", () => {
    it("should include single line comments", () => {
      expect(exampleContent.indexOf("Single Line Comment here")).not.toBe(-1);
    });

    it("should include multi line comments", () => {
      expect(
        exampleContent.indexOf("Multi Line Comment here\nAwesome")
      ).not.toBe(-1);
    });
  });

  describe("Error handling", () => {
    it("should throw error for wrong type", () => {
      expect(() => {
        ExampleClass.actionForMultipleTapsWithCount("foo");
      }).toThrowErrorMatchingSnapshot();

      expect(() => {
        ExampleClass.actionForMultipleTapsWithCount(42);
      }).not.toThrow();

      expect(() => {
        ExampleClass.actionForMultipleTapsWithCountAtPoint(3, 4);
      }).toThrowErrorMatchingSnapshot();

      expect(() => {
        ExampleClass.actionForMultipleTapsWithCountAtPoint(42, { x: 1, y: 2 });
      }).not.toThrow();
    });

    it("should throw error for not in accepted range", () => {
      expect(() => {
        ExampleClass.actionForScrollInDirectionAmountXOriginStartPercentageYOriginStartPercentage(
          "flipside",
          3,
          4,
          5
        );
      }).toThrowErrorMatchingSnapshot();

      expect(() => {
        ExampleClass.actionForScrollInDirectionAmountXOriginStartPercentageYOriginStartPercentage(
          "down",
          3,
          4,
          5
        );
      }).not.toThrow();
    });

    it("should thow error for CGPoint with wrong x and y values", () => {
      expect(() => {
        ExampleClass.actionForMultipleTapsWithCountAtPoint(3, {x: 3, y: 4});
      }).not.toThrow();
      
      expect(() => {
        ExampleClass.actionForMultipleTapsWithCountAtPoint(3, {x: "3", y: 4});
      }).toThrowErrorMatchingSnapshot();

      expect(() => {
        ExampleClass.actionForMultipleTapsWithCountAtPoint(3, {x: 3});
      }).toThrowErrorMatchingSnapshot();
    });
  });

  describe("Invocations", () => {
    it("should return the invocation object for methods", () => {
      const result = ExampleClass.actionForMultipleTapsWithCount(3);

      expect(result.target.type).toBe('Class');
      expect(result.target.value).toBe('GREYActions');

      expect(result.method).toBe('actionForMultipleTapsWithCount:');

      expect(result.args.length).toBe(1);
      expect(result.args[0].type).toBe('NSInteger');
      expect(result.args[0].value).toBe(3);
      expect(result).toMatchSnapshot();
    });

    it("should return the invocation object for methods with objects as args", () => {
      const result = ExampleClass.actionForMultipleTapsWithCountAtPoint(3, {x: 3, y: 4});

      expect(result.target.type).toBe('Class');
      expect(result.target.value).toBe('GREYActions');

      expect(result.method).toBe('actionForMultipleTapsWithCount:atPoint:');

      expect(result.args.length).toBe(2);
      expect(result.args[0].type).toBe('NSInteger');
      expect(result.args[0].value).toBe(3);
      expect(result.args[1].type).toBe('CGPoint');
      expect(result.args[1].value).toEqual({x: 3, y: 4});
      expect(result).toMatchSnapshot();
    });

    it("should return the invocation object for methods with strings", () => {
      const result = ExampleClass.actionForTypeText("Foo");

      expect(result.args[0].type).toBe('NSString');
      expect(result).toMatchSnapshot();
    });

    it("should sanitize the directions", () => {
      const result = ExampleClass.actionForScrollInDirectionAmountXOriginStartPercentageYOriginStartPercentage(
        "down",
        3,
        4,
        5
      );

      expect(result.args[0].type).toBe("NSInteger");
      expect(result.args[0].value).toBe(4);
      expect(result).toMatchSnapshot();
    });
  });

  describe("filter functions with unknown arguments", () => {
    it("should not have a function with one unkown type", () => {
      expect(ExampleClass.actionWithUnknownType).not.toBeDefined();
    });

    it("should not have a function with one kown and one unknown type", () => {
      expect(ExampleClass.actionWithKnownAndUnknownType).not.toBeDefined();
    });
  });

  afterAll(() => {
    // Clean up
    remove.removeSync("./__tests__/generated");
  });
});
