const nodeGlob = require("glob");
const log = require('npmlog');
const fs = require("fs");

function glob(pattern, options) {
  return new Promise((resolve, reject) => {
    nodeGlob(pattern, options, (err, files) => {
      if (err) {
        reject(err);
      } else {
        resolve(files);
      }
    });
  });
}

async function getAppNameFromAppDelegate() {
  let filePaths;
  try {
    filePaths = await glob("ios/**/AppDelegate.m");
    if (filePaths.length < 1) {
      log.warn(`Found no AppDelegate.m`);
      return '';
    }
    if (filePaths.length > 1) {
      log.verbose(`Found more than one AppDelegate.m, picking the first of ${filePaths}`);
    }
  } catch (e) {
    log.verbose(`Error while finding the file`, e);
    return '';
  }
  const filePath = filePaths[0];

  const moduleNameRegex = /moduleName:@"(.*)"/;
  const appDelegate = fs.readFileSync(filePath, 'utf8');

  const matches = moduleNameRegex.exec(appDelegate);
  if (!matches) {
    throw new Error("Could not find the app name from AppDelegate.m");
  }

  return matches[1];
}

async function getAppNameFromAndroidManifest() {
  let filePaths;
  try {
    filePaths = await glob("android/**/AndroidManifest.xml");
    if (filePaths.length < 1) {
      log.warn(`Found no AndroidManifest.xml`);
      return '';
    }
    if (filePaths.length > 1) {
      log.verbose(`Found more than one AndroidManifest.xml, picking the first of ${filePaths}`);
    }
  } catch (e) {
    log.verbose(`Error while finding the file`, e);
    return '';
  }

  const filePath = filePaths[0];
  const packageNameRegex = /package="com\.(.*)"/;
  const androidManifest = fs.readFileSync(filePath, 'utf8');
  const matches = packageNameRegex.exec(androidManifest);

  if (!matches) {
    throw new Error("Could not find the app name from AndroidManifest.xml");
  }
  return matches[1];
}

async function getAppName(platform) {
  if (platform === "ios") {
    return getAppNameFromAppDelegate();
  }

  if (platform === "android") {
    return getAppNameFromAndroidManifest();
  }
  return "";
}

module.exports = {
  getAppName
};
