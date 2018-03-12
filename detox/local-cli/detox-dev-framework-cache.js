#!/usr/bin/env node

const path = require('path');
const cp = require('child_process');

cp.execSync(path.join(__dirname, '../scripts/build_framework_dev.ios.sh'), { stdio: 'inherit' });
