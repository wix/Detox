const chalk = require('chalk');
const log = require('../../src/utils/logger').child({ __filename });
const migrationGuideUrl = 'https://github.com/wix/Detox/blob/master/docs/Guide.Migration.md#migrating-from-detox-120x-to-121x';

function coerceDeprecation(option) {
  return function coerceDeprecationFn(value) {
    log.warn(`Beware: ${option} will be removed in the next version of Detox.`);
    log.warn(`See the migration guide:\n${migrationGuideUrl} `);

    return value;
  };
}

function printFileDeprecationWarning(file) {
  log.warn('Deprecated: "file" option in "detox" section of package.json won\'t be supported in the next Detox version.\n');
  console.log(`   "detox": {`);
  console.log(chalk.red(`-    "file": ${JSON.stringify(file)},`));
  console.log(chalk.green(`+    "specs": ${JSON.stringify(file)},\n`));
  log.warn(`Please rename it to "specs", as demonstrated above.`);
}

module.exports = {
  coerceDeprecation,
  migrationGuideUrl,
  printFileDeprecationWarning,
};
