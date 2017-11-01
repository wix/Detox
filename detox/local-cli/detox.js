#!/usr/bin/env node

const program = require('commander');

program
  .arguments('<process>')
  .command('test', 'Initiating your test suite')
  .command('build', `[convince method] Run the command defined in 'configuration.build'`)
  .command('run-server', 'Starts a standalone detox server')
  .command('init', 'Create initial e2e tests folder')
  .command('clean-framework-cache', `Delete all compiled framework binaries from ~/Library/Detox, they will be rebuilt on 'npm install' or when running 'build-framework-cache'`)
  .command('build-framework-cache', `Build Detox.framework to ~/Library/Detox. The framework cache is specific for each combination of Xcode and Detox versions`)
  .parse(process.argv);
