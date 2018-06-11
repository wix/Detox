#!/usr/bin/env node
const cp = require('child_process');
const path = require('path');
const fs = require('fs');

const detoxPath = path.join(process.cwd(), 'node_modules/detox');
const detoxPackageJsonPath = path.join(detoxPath, 'package.json');

const isDetoxInstalled = (() => {
  if (fs.existsSync(detoxPackageJsonPath)) {
    return true;
  }
  // Check if this repo is within a Yarn workspace
  const monorepoPackageJsonPath = path.join(
    path.resolve(process.cwd(), '..'),
    'package.json'
  );
  if (!fs.existsSync(monorepoPackageJsonPath)) {
    return false;
  }
  const monorepoPackageJson = require(monorepoPackageJsonPath);
  const { workspaces } = monorepoPackageJson;
  if (!workspaces || !workspaces.packages) {
    return false;
  }
  const localProjectName = path.basename(process.cwd());
  if (!workspaces.packages.includes(localProjectName)) {
    return false;
  }
  const hoistedDetoxPath = path.join(
    path.resolve(process.cwd(), '..'),
    'node_modules/detox'
  );
  const hoistedDetoxPackageJsonPath = path.join(hoistedDetoxPath, 'package.json');
  return fs.existsSync(hoistedDetoxPackageJsonPath);
})();

if (isDetoxInstalled) {
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
