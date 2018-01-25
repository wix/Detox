const path = require('path');
const _ = require('lodash');

class APKPath {

  static getTestApkPath(originalApkPath) {
    const originalApkPathObj = path.parse(originalApkPath);
    let tempPath = originalApkPathObj.dir.split(path.sep);
    const splitFileName = originalApkPathObj.name.split('-');

    const buildType = _.last(splitFileName);
    const flavorDimensions = _.slice(splitFileName, 1, splitFileName.length - 1);

    tempPath = _.dropRight(tempPath, 1); //buildType
    tempPath = _.dropRight(tempPath, flavorDimensions.length); //flavorDimensions

    const testApkPath = path.join(tempPath.join(path.sep), 'androidTest', flavorDimensions.join(path.sep), buildType, `${originalApkPathObj.name}-androidTest${originalApkPathObj.ext}`);
    return testApkPath;
  }
}

module.exports = APKPath;
