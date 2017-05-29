#!/usr/bin/env node

const program = require('commander');
const cp = require('child_process');
const fs = require('fs');
const path = require('path');

program.parse(process.argv);

if (fs.existsSync(path.join(__dirname, 'node_modules/.bin/detox-server'))) {
  cp.execSync('node_modules/.bin/detox-server', {stdio: 'inherit'});
} else {
  cp.execSync('node_modules/detox/node_modules/.bin/detox-server', {stdio: 'inherit'});
}

