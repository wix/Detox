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

    earlGreyGenerator(files);

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
        ExampleClass.actionForMultipleTapsWithCountatPoint(3, 4);
      }).toThrowErrorMatchingSnapshot();

      expect(() => {
        ExampleClass.actionForMultipleTapsWithCountatPoint(42, { x: 1, y: 2 });
      }).not.toThrow();
    });

    it("should throw error for not in accepted range", () => {
      expect(() => {
        ExampleClass.actionForScrollInDirectionamountxOriginStartPercentageyOriginStartPercentage(
          "flipside",
          3,
          4,
          5
        );
      }).toThrowErrorMatchingSnapshot();

      expect(() => {
        ExampleClass.actionForScrollInDirectionamountxOriginStartPercentageyOriginStartPercentage(
          "down",
          3,
          4,
          5
        );
      });
    });
  });

  afterAll(() => {
    // Clean up
    remove.removeSync("./__tests__/generated");
  });
});
