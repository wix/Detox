const fs = require('fs-extra');
const log = require('npmlog');

class ArtifactsPathsProvider {
  constructor(destinationParent) {
    if (!destinationParent) {
      throw new Error('destinationParent should not be undefined');
    }
    this._destinationRoot = `${destinationParent}/detox_artifacts.${new Date().toISOString()}`;
    try {
      fs.ensureDirSync(this._destinationRoot);
    } catch (ex) {
      throw new Error(
        `Could not create artifacts root dir: ${this._destinationRoot}` +
          `\nbecause of: ` + ex.toString()
      );
    }
  }

  createPathForTest(number, ...nameComponents) {
    if (number !== parseInt(number) || number <= 0) {
      throw new Error('The number should be a positive integer');
    }

    const lastPathComponent = [number].concat(nameComponents).join('.');
    const pathForTest = `${this._destinationRoot}/${lastPathComponent}`;
    try {
      fs.ensureDirSync(pathForTest);
    } catch (ex) {
      log.warn(ex, `Could not create artifacts test dir: ${pathForTest}`);
      return undefined;
    }

    return pathForTest;
  }
}

module.exports = ArtifactsPathsProvider;
