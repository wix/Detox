const path = require('path');

const tempfile = require('tempfile');

const temporaryPath = require('./temporaryPath');

describe('temporaryPath', () => {
  it('should create a temporary file like *.detox.png for .png', expectTemporaryFile('png'));
  it('should create a temporary file like *.detox.log for .log', expectTemporaryFile('log'));
  it('should create a temporary file like *.detox.mp4 for .mp4', expectTemporaryFile('mp4'));
  it('should create a temporary file like *.detox.viewhierarchy for .dtxrec', expectTemporaryFile('dtxrec'));
  it('should create a temporary file like *.detox.viewhierarchy for .viewhierarchy', expectTemporaryFile('viewhierarchy'));

  it('should generate a glob mask for those temporary files', () => {
    expect(temporaryPath.mask()).toMatch(/\*\.detox\.\*$/);
  });

  function expectTemporaryFile(extension) {
    return function () {
      expect(path.dirname(temporaryPath.for[extension]())).toBe(path.dirname(tempfile()));
      expect(temporaryPath.for[extension]()).toMatch(new RegExp(`.+\\.detox\\.${extension}$`));
    };
  }
});
