#!/usr/bin/env node

const cp = require('child_process');
const path = require('path');

if (process.platform === 'darwin' && !process.env.DETOX_DISABLE_POD_INSTALL) {
  cp.execSync('pod install', { 
    cwd: path.join(process.cwd(), 'detox/test/ios'),
    stdio: 'inherit'
  });
}
