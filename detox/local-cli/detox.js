#!/usr/bin/env node

// const program = require('commander');

// program
// .arguments('<process>')
// .command('test', 'Initiating your test suite')
// .command('init', '[convenience method] Scaffold initial e2e tests folder')
// .command('build', `[convenience method] Run the command defined in 'configuration.build'`)
// .command('run-server', 'Starts a standalone detox server')
// .command(
//   'clean-framework-cache',
//   `Delete all compiled framework binaries from ~/Library/Detox, they will be rebuilt on 'npm install' or when running 'build-framework-cache'`
// )
// .command(
//   'build-framework-cache',
//   `Build Detox.framework to ~/Library/Detox. The framework cache is specific for each combination of Xcode and Detox versions`
// )
// .parse(process.argv);

const { ArgumentParser } = require('argparse');
const version = require('../package.json').version;

const build = require('./detox-build');

const subCommands = [build];

const parser = new ArgumentParser({
  version: version,
  addHelp: true,
  description: 'Gray Box End-to-End Testing and Automation Framework for Mobile Apps'
});

subCommands.forEach(sub => {
  const subParser = parser.addParser(sub.title, { addHelp: true });
  // {
  //   title: sub.title,
  //   dest: sub.title,
  //   help: sub.description
  // });

  sub.arguments.forEach(arg => {
    const argParser = subParser.addParser('foo');
    argParser.addArgument(arg.flag, {
      help: arg.help
    });
  });
});

var args = parser.parseArgs();
console.dir(args);
