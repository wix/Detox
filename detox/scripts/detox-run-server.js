#!/usr/bin/env node

const program = require('commander');
const child_process = require('child_process');
program
  .parse(process.argv);

child_process.execSync('detox-server', {stdio: 'inherit'});