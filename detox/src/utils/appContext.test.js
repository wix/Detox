const mock = require('./appContext.mock');
const mockIosFileContent = mock.iOSFileContent;
const mockAndroidFileContent = mock.androidFileContent;

let appContext;

describe('appContext', () => {
  describe('getAppName', () => {
    it("should return empty string if platform is unknown", async () => {
      appContext = require('./appContext');
      const result = await appContext.getAppName("blackberry");
      expect(result).toBe("");
    });
    describe("ios", () => {
      it("should get name from app delegate on ios", async () => {
        jest.mock('glob', () => (pattern, options, cb) => cb(null, ["ios/build/AppDelegate.m"]));
        jest.mock("fs", () => ({
          readFileSync: jest.fn(() => mockIosFileContent)
        }));
        appContext = require('./appContext');

        const name = await appContext.getAppName("ios");
        expect(name).toBe("myiOSApp");
      });

      it("should return an empty string if no file is found", async () => {
        jest.mock('glob', () => (pattern, options, cb) => cb(null, []));
        appContext = require('./appContext');

        const name = await appContext.getAppName("ios");
        expect(name).toBe("");
      });

      it("should return an empty string if an error is thrown", async () => {
        jest.mock('glob', () => (pattern, options, cb) => cb(new Error("something went wrong"), null));
        appContext = require('./appContext');

        const name = await appContext.getAppName("ios");
        expect(name).toBe("");
      });

      it("should pick the first file if multiple are found", async () => {
        jest.mock('glob', () => (pattern, options, cb) => cb(null, ["ios/build/AppDelegate.m", "ios/foo/AppDelegate.m"]));
        jest.mock("fs", () => ({
          readFileSync: jest.fn(() => mockIosFileContent)
        }));
        const fs = require("fs");
        appContext = require('./appContext');

        const name = await appContext.getAppName("ios");
        expect(name).toBe("myiOSApp");
        expect(fs.readFileSync).toHaveBeenCalledWith("ios/build/AppDelegate.m", "utf8");
      });

      it("should throw if no names can be found in appDelegate", async () => {
        jest.mock('glob', () => (pattern, options, cb) => cb(null, ["ios/build/AppDelegate.m"]));
        jest.mock("fs", () => ({
          readFileSync: jest.fn(() => mockIosFileContent.replace("moduleName", "modName"))
        }));
        appContext = require('./appContext');

        try {
          const name = await appContext.getAppName("ios");
          fail("Should have thrown");
        } catch (e) {
          expect(e).toBeDefined();
        }
      });
    });

    describe("android", () => {
      it("should get name from android manifest in android", async () => {
        jest.mock('glob', () => (pattern, options, cb) => cb(null, ["android/src/main/AndroidManifest.xml"]));
        jest.mock("fs", () => ({
          readFileSync: jest.fn(() => mockAndroidFileContent)
        }));
        appContext = require('./appContext');

        const name = await appContext.getAppName("android");
        expect(name).toBe("myAndroidApp");
      });

      it("should return an empty string if no file is found", async () => {
        jest.mock('glob', () => (pattern, options, cb) => cb(null, []));
        appContext = require('./appContext');

        const name = await appContext.getAppName("android");
        expect(name).toBe("");
      });

      it("should return an empty string if an error is thrown", async () => {
        jest.mock('glob', () => (pattern, options, cb) => cb(new Error("something went wrong"), null));
        appContext = require('./appContext');

        const name = await appContext.getAppName("android");
        expect(name).toBe("");
      });

      it("should pick the first file if multiple are found", async () => {
        jest.mock('glob', () => (pattern, options, cb) => cb(null, ["android/src/main/AndroidManifest.xml", "android/src/other/AndroidManifest.xml"]));
        jest.mock("fs", () => ({
          readFileSync: jest.fn(() => mockAndroidFileContent)
        }));
        const fs = require("fs");
        appContext = require('./appContext');

        const name = await appContext.getAppName("android");
        expect(name).toBe("myAndroidApp");
        expect(fs.readFileSync).toHaveBeenCalledWith("android/src/main/AndroidManifest.xml", "utf8");
      });

      it("should throw if no names can be found in appDelegate", async () => {
        jest.mock('glob', () => (pattern, options, cb) => cb(null, ["android/src/main/AndroidManifest.xml"]));
        jest.mock("fs", () => ({
          readFileSync: jest.fn(() => mockAndroidFileContent.replace("package=", "pkg="))
        }));
        appContext = require('./appContext');

        try {
          const name = await appContext.getAppName("android");
          fail("Should have thrown");
        } catch (e) {
          expect(e).toBeDefined();
        }
      });
    });
  });
});
