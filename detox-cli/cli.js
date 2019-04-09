#!/usr/bin/env node
const cp = require('child_process');
const path = require('path');
const fs = require('fs');

const detoxPath = path.join(process.cwd(), 'node_modules/detox');
const detoxPackageJsonPath = path.join(detoxPath, 'package.json');

if (fs.existsSync(detoxPackageJsonPath)) {
  // { shell: true } option seems to break quoting on windows? Otherwise this would be much simpler.
  if (process.platform === 'win32') {
    const result = cp.spawnSync(
      'cmd',
      ['/c', path.join(process.cwd(), 'node_modules/.bin/detox.cmd')].concat(process.argv.slice(2)),
      { stdio: 'inherit' });
    process.exit(result.status);
  } else {
    const result = cp.spawnSync(
      path.join(process.cwd(), 'node_modules/.bin/detox'),
      process.argv.slice(2),
      { stdio: 'inherit' });
    process.exit(result.status);
  }
} else {
  console.log(detoxPackageJsonPath);
  console.log("detox is not installed in this directory");
  process.exit(1);
}