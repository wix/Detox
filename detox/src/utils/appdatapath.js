const os = require('os');
const path = require('path');

function darwin() {
  return path.join(os.homedir(), 'Library');
}

function linux() {
  if (process.env.XDG_DATA_HOME) {
    return path.join(process.env.XDG_DATA_HOME);
  }

  return path.join(os.homedir(), '.local', 'share');
}

function win32() {
  if (process.env.LOCALAPPDATA) {
    return path.join(process.env.LOCALAPPDATA, 'data');
  }

  return path.join(process.env.USERPROFILE, 'Application Data');
}

function appDataPath() {
  switch (os.platform()) {
    case 'darwin':
      return darwin();
    case 'linux':
      return linux();
    case 'win32':
      return win32();
    default:
      throw new Error(`${os.platform()} is not supported`);
  }
}

module.exports = {
  appDataPath
};
