describe("download-file util", () => {
  const OS_TMP_DIR = "/tmp/ponies";

  let mockDownloadedContent;
  let fs;
  let downloadFile;

  beforeEach(() => {
    jest.mock("os", () => ({
      tmpdir: jest.fn(),
    }));
    require("os").tmpdir.mockReturnValue(OS_TMP_DIR);

    jest.mock("fs", () => ({
      writeFileSync: jest.fn(),
    }));
    fs = require("fs");

    jest.mock("child_process", () => ({
      execFileSync: () => mockDownloadedContent
    }));

    downloadFile = require("../downloadFile");
  });

  it("should save content to the temp dir file", () => {
    mockDownloadedContent = 'can haz teh c0dez';

    downloadFile("foo.bar" /*, encoding = "none" */);

    expect(fs.writeFileSync).toHaveBeenCalled();
    const call = fs.writeFileSync.mock.calls[0];
    expect(call[0]).toContain(OS_TMP_DIR);
    expect(call[0]).toContain(".java");
    expect(call[1]).toEqual(mockDownloadedContent);
  });

  it("should save the base64 decoded content to the temp dir file", () => {
    mockDownloadedContent = "cGFja2FnZSBhbmRyb2lkLnN1cHBvcnQudGVzdC5lc3ByZXNzbzsNCmltcG9ydCBhbmRyb2lkLnZpZXcuVmlld0NvbmZpZ3VyYXRpb247DQoNCmltcG9ydCBvcmcuaGFtY3Jlc3QuTWF0Y2hlcjsNCg0KaW1wb3J0IGphdmEudXRpbC5MaXN0Ow0KDQovKioNCiAqIEVudHJ5IHBvaW50IHRvIHRoZSBFc3ByZXNzbyBmcmFtZXdvcmsuIFRlc3QgYXV0aG9ycyBjYW4gaW5pdGlhdGUgdGVzdGluZyBieSB1c2luZyBvbmUgb2YgdGhlIG9uKg0KICogbWV0aG9kcyAoZS5nLiBvblZpZXcpIG9yIHBlcmZvcm0gdG9wLWxldmVsIHVzZXIgYWN0aW9ucyAoZS5nLiBwcmVzc0JhY2spLg0KICovDQpwdWJsaWMgZmluYWwgY2xhc3MgRXNwcmVzc28gew0KDQogIHByaXZhdGUgc3RhdGljIGZpbmFsIEJhc2VMYXllckNvbXBvbmVudCBCQVNFID0gR3JhcGhIb2xkZXIuYmFzZUxheWVyKCk7DQogIHByaXZhdGUgc3RhdGljIGZpbmFsIElkbGluZ1Jlc291cmNlUmVnaXN0cnkgUkVHSVNUUlkgPSBCQVNFLmlkbGluZ1Jlc291cmNlUmVnaXN0cnkoKTsNCg0KICBwcml2YXRlIEVzcHJlc3NvKCkge30NCg0KICAvKioNCiAgICogQ3JlYXRlcyBhIHtAbGluayBWaWV3SW50ZXJhY3Rpb259IGZvciBhIGdpdmVuIHZpZXcuIE5vdGU6IHRoZSB2aWV3IGhhcw0KICAgKiB0byBiZSBwYXJ0IG9mIHRoZSAgdmlldyBoaWVyYXJjaHkuIFRoaXMgbWF5IG5vdCBiZSB0aGUgY2FzZSBpZiBpdCBpcyByZW5kZXJlZCBhcyBwYXJ0IG9mDQogICAqIGFuIEFkYXB0ZXJWaWV3IChlLmcuIExpc3RWaWV3KS4gSWYgdGhpcyBpcyB0aGUgY2FzZSwgdXNlIEVzcHJlc3NvLm9uRGF0YSB0byBsb2FkIHRoZSB2aWV3DQogICAqIGZpcnN0Lg0KICAgKg0KICAgKiBAcGFyYW0gdmlld01hdGNoZXIgdXNlZCB0byBzZWxlY3QgdGhlIHZpZXcuDQogICAqDQogICAqIEBzZWUgI29uRGF0YShvcmcuaGFtY3Jlc3QuTWF0Y2hlcikNCiAgICovDQogIC8vIFRPRE8gY2hhbmdlIHBhcmFtZXRlciB0byB0eXBlIHRvIE1hdGNoZXI8PyBleHRlbmRzIFZpZXc+IHdoaWNoIGN1cnJlbnRseSBjYXVzZXMgRGFnZ2VyIGlzc3Vlcw0KICBwdWJsaWMgc3RhdGljIFZpZXdJbnRlcmFjdGlvbiBvblZpZXcoZmluYWwgTWF0Y2hlcjxWaWV3PiB2aWV3TWF0Y2hlcikgew0KICAgIHJldHVybiBCQVNFLnBsdXMobmV3IFZpZXdJbnRlcmFjdGlvbk1vZHVsZSh2aWV3TWF0Y2hlcikpLnZpZXdJbnRlcmFjdGlvbigpOw0KICB9DQp9";

    downloadFile("foo.bar", "base64");

    expect(fs.writeFileSync).toHaveBeenCalled();
    const call = fs.writeFileSync.mock.calls[0];
    expect(call[1]).toEqual(
      expect.stringContaining("public final class Espresso {")
    );
  });
});
