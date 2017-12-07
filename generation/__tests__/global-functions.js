const globals = require("../core/global-functions");

describe("globals", () => {
  describe("sanitize_greyDirection", () => {
    it('should return numbers for strings', () => {
      expect(globals.sanitize_greyDirection('left')).toBe(1);
      expect(globals.sanitize_greyDirection("right")).toBe(2);
      expect(globals.sanitize_greyDirection("up")).toBe(3);
      expect(globals.sanitize_greyDirection("down")).toBe(4);
    });

    it('should fail with unknown value', () => {
      expect(() => {
        globals.sanitize_greyDirection("kittens");
      }).toThrowErrorMatchingSnapshot();
    });
  });

  describe("sanitize_greyContentEdge", () => {
    it("should return numbers for strings", () => {
      expect(globals.sanitize_greyContentEdge("left")).toBe(0);
      expect(globals.sanitize_greyContentEdge("right")).toBe(1);
      expect(globals.sanitize_greyContentEdge("top")).toBe(2);
      expect(globals.sanitize_greyContentEdge("bottom")).toBe(3);
    });

    it("should fail with unknown value", () => {
      expect(() => {
        globals.sanitize_greyContentEdge("kittens");
      }).toThrowErrorMatchingSnapshot();
    });
  });

  describe("sanitize_uiAccessibilityTraits", () => {
    it("should return numbers for traits", () => {
      expect(globals.sanitize_uiAccessibilityTraits(["button", "link"])).toBe(3);
      expect(globals.sanitize_uiAccessibilityTraits(["summary", "allowsDirectInteraction"])).toBe(16896);
    });

    it("should throw if unknown trait is accessed", () => {
      expect(() => globals.sanitize_uiAccessibilityTraits(["unknown"])).toThrowErrorMatchingSnapshot();
    });
  });
});