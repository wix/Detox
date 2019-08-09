const fs = require('fs');
const path = require('path');

function which(filename) {
  const sep = process.platform === 'win32' ? ';' : ':';

  for (dirOnPath of process.env.PATH.split(sep)) {
    const potentialExecutable = path.join(dirOnPath, filename);
    try {
      fs.accessSync(potentialExecutable, fs.constants.X_OK);
      return potentialExecutable;
    } catch (err) {
      // doesn't exist or not executable
    }
  }
  return null;
}

module.exports = {
  which,
};
