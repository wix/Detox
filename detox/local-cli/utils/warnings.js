const chalk = require('chalk');
const log = require('../../src/utils/logger').child({ __filename });

function coerceDeprecation(option) {
  return function coerceDeprecationFn(value) {
    log.warn(`Beware: ${option} will be removed in the next version of Detox.`);

    return value;
  };
}

const DETOX_ARGV_OVERRIDE_NOTICE = `
   _____ _____ ___________
  /  ___|_   _|  _  | ___ \\  $DETOX_ARGV_OVERRIDE is detected
  \\ '--.  | | | | | | |_/ /
   '--. \\ | | | | | |  __/   This feature is designed solely
  /\\__/ / | | \\ \\_/ / |      for ad-hoc troubleshooting of
  \\____/  \\_/  \\___/\\_|      failing builds.

  Do not use this feature in scripts and do not rely on it
  for anything that is not a quick-and-dirty rerun of your
  failing E2E script.

  Use it sparingly for emergency Detox launches with extra
  debugging flags and features, to speed up your investigation
  and collect additional test artifacts. For more details, see:

  https://github.com/wix/Detox/blob/master/docs/APIRef.DetoxCLI.md#detox_argv_override

`;

module.exports = {
  coerceDeprecation,
  DETOX_ARGV_OVERRIDE_NOTICE,
};
