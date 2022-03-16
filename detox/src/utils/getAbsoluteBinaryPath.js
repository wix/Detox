const fs = require('fs');
const path = require('path');

const DetoxRuntimeError = require('../errors/DetoxRuntimeError');

function getAbsoluteBinaryPath(appPath) {
  if (path.isAbsolute(appPath)) {
    return appPath;
  }

  const absPath = path.join(process.cwd(), appPath);
  if (fs.existsSync(absPath)) {
    return absPath;
  } else {
    throw new DetoxRuntimeError({
      message: `Failed to find the app binary at:\n${absPath}`,
      hint: `Make sure that:
1. You built the app before running tests:
  detox build -c <your-configuration-name>
2. The app binary can be found at the given path.`,
    });
  }
}

module.exports = getAbsoluteBinaryPath;
