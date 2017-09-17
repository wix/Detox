#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const os = require('os');

if (os.platform() === 'darwin') {
  const frameworkPath = path.join(os.homedir(), '/Library/Detox');
  console.log(`Removing framework binaries from ${frameworkPath}`);
  deleteFolderRecursive(frameworkPath);
}

function deleteFolderRecursive(path) {
  let files = [];
  if (fs.existsSync(path)) {
    files = fs.readdirSync(path);
    files.forEach(function(file, index) {
      let curPath = path + "/" + file;
      if (fs.lstatSync(curPath).isDirectory()) {
        deleteFolderRecursive(curPath);
      } else {
        console.log(`Removing ${curPath}`);
        fs.unlinkSync(curPath);
      }
    });
    fs.rmdirSync(path);
  }
}
