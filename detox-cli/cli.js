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
    const cliArgs = process.argv.slice(2);
    if(cliArgs.length == 0 || cliArgs[0] !== "recorder") {
      //Detox path
      const result = cp.spawnSync(
        path.join(process.cwd(), 'node_modules/.bin/detox'),
        cliArgs,
        { stdio: 'inherit' });
      process.exit(result.status);
    } else {
      //Detox Recorder path
      const detoxRecorderPath = path.join(process.cwd(), 'node_modules/detox-recorder');
      const detoxRecorderCLIPath = path.join(detoxRecorderPath, "DetoxRecorderCLI");
      const recorderCLIArgs = process.argv.slice(3);
      
      if (fs.existsSync(detoxRecorderCLIPath)) {
        const result = cp.spawnSync(detoxRecorderCLIPath, recorderCLIArgs, { stdio: 'inherit' });
        process.exit(result.status);
      } else {
        console.log(`Detox Recorder is not installed in this directory: ${detoxRecorderPath}`);
        process.exit(1);
      }
    }
  }
} else {
  console.log(`Detox is not installed in this directory: ${detoxPath}`);
  process.exit(1);
}