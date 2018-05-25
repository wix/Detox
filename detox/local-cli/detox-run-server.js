#!/usr/bin/env node

const program = require('commander');
const cp = require('child_process');
const path = require('path');

program.parse(process.argv);

const serverPackagePath = require.resolve('detox-server/package.json');
const cli = require(serverPackagePath).bin['detox-server'];
const binPath = path.join(path.dirname(serverPackagePath), cli);
cp.execFileSync('node', [binPath], {stdio: 'inherit'});
