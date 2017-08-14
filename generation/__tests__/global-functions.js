const globals = require("../earl-grey/global-functions");

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
});