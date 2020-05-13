const fs = require('fs');
const path = require('path');
const _ = require('lodash');
const string = require('../../../../utils/string');

class APKPath {

  static getTestApkPath(originalApkPath) {
    // fix: custom apk path without build
    // for example:
    // "android.att.release": {
    //   "binaryPath": "./debugger_app/app-20200415.apk",
    //   "type": "android.attached",
    //   "device": { "adbName": "123456789" }
    // }
    const fullApkPath = path.resolve(originalApkPath);
    if (fs.existsSync(fullApkPath)) {
      return fullApkPath;
    }

    const originalApkPathObj = path.parse(originalApkPath);
    let tempPath = originalApkPathObj.dir.split(path.sep);
    const splitFileName = originalApkPathObj.name.split('-');

    const buildType = _.last(splitFileName);
    const flavorDimensions = _.slice(splitFileName, 1, splitFileName.length - 1);

    tempPath = _.dropRight(tempPath, 1); //buildType

    let flavorDimensionsPath = '';
    if (flavorDimensions.length > 0) {
      flavorDimensionsPath = string.lowerCamelCaseJoin(flavorDimensions);
      tempPath = _.dropRight(tempPath, 1); //flavorDimensions
    }

    const testApkPath = path.join(tempPath.join(path.sep), 'androidTest', flavorDimensionsPath, buildType, `${originalApkPathObj.name}-androidTest${originalApkPathObj.ext}`);
    return testApkPath;
  }
}

module.exports = APKPath;
