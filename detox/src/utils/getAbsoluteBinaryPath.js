const fs = require('fs');
const path = require('path');

function getAbsoluteBinaryPath(appPath) {
  if (path.isAbsolute(appPath)) {
    return appPath;
  }

  const absPath = path.join(process.cwd(), appPath);
  if (fs.existsSync(absPath)) {
    return absPath;
  } else {
    throw new Error(`app binary not found at '${absPath}', did you build it?`);
  }
}

module.exports = getAbsoluteBinaryPath;
