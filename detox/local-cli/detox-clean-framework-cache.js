#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');
const os = require('os');

async function run() {
  if (os.platform() === 'darwin') {
    const frameworkPath = path.join(os.homedir(), '/Library/Detox');
    console.log(`Removing framework binaries from ${frameworkPath}`);
    await fs.remove(frameworkPath);
  }
}

run();
