const path = require('path');

const chalk = require('chalk');
const _ = require('lodash');

const SEARCH_VALUE = ['', 'detox', 'runners', 'jest-circus', ''].join(path.sep);
const REPLACE_VALUE = ['', 'detox', 'runners', 'jest', ''].join(path.sep);

function jsify(pathToFile) {
  return 'detox/' + path
    .relative(
      path.join(__dirname, '..'),
      pathToFile
    )
    .replace(/\\/g, '/')
    .replace(/(?:\/index)?\.js$/, '');
}

const redirectWithWarning = _.memoize((
  oldPath,
  newPath = oldPath.replace(SEARCH_VALUE, REPLACE_VALUE)
) => {
  redirectWithWarning._log([
    '[DEPRECATION] Detox detected an attempt to require a module from an outdated location, please change in your project:',
    `- ${jsify(oldPath)}`,
    `+ ${jsify(newPath)}`,
    '',
  ].join('\n'));

  return require(newPath);
});

// @ts-ignore
// istanbul ignore next
redirectWithWarning._log = msg => process.stderr.write(chalk.yellow(msg) + '\n');

module.exports = redirectWithWarning;
