#!/usr/bin/env node

const program = require('commander');
const cp = require('child_process');
program.parse(process.argv);

cp.execSync('node_modules/.bin/detox-server', {stdio: 'inherit'});
