const path = require('path');

const _ = require('lodash');

const string = require('../../../../../utils/string');

function getTestApkPath(originalApkPath) {
  const originalApkPathObj = path.parse(originalApkPath);
  let tempPath = originalApkPathObj.dir.split(path.sep);
  const splitFileName = originalApkPathObj.name.split('-');

  const buildType = _.last(splitFileName);
  const flavorDimensions = _.slice(splitFileName, 1, splitFileName.length - 1);

  tempPath = _.dropRight(tempPath, 1); // buildType

  let flavorDimensionsPath = '';
  if (flavorDimensions.length > 0) {
    flavorDimensionsPath = string.lowerCamelCaseJoin(flavorDimensions);
    tempPath = _.dropRight(tempPath, 1); // flavorDimensions
  }

  const finalFileName = `${originalApkPathObj.name}-androidTest${originalApkPathObj.ext}`;
  return path.join(tempPath.join(path.sep), 'androidTest', flavorDimensionsPath, buildType, finalFileName);
}

module.exports = {
  getTestApkPath,
};
