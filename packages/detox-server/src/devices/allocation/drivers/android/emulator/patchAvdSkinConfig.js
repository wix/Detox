const fs = require('fs');
const path = require('path');

const ini = require('ini');

const DetoxRuntimeError = require('../../../../../errors/DetoxRuntimeError');
const environment = require('../../../../../utils/environment');
const log = require('../../../../../utils/logger');

const EMU_BIN_STABLE_SKIN_VER = 28;

async function patchAvdSkinConfig(avdName, binaryVersion) {
  if (!binaryVersion) {
    log.warn({ event: 'EMU_SKIN_CFG_PATCH' }, [
      'Failed to detect emulator version! (see previous logs)',
      'This leaves Detox unable to tell if it should automatically apply this patch-fix: https://stackoverflow.com/a/47265664/453052, which seems to be needed in emulator versions < 28.',
      'If you feel this is not needed, you can either ignore this message, or otherwise apply the patch manually.',
    ].join('\n'));
    return;
  }

  if (binaryVersion >= EMU_BIN_STABLE_SKIN_VER) {
    return;
  }

  const avdPath = environment.getAvdDir(avdName);
  const configFile = path.join(avdPath, 'config.ini');
  const config = ini.parse(fs.readFileSync(configFile, 'utf-8'));

  if (!config['skin.name']) {
    const width = config['hw.lcd.width'];
    const height = config['hw.lcd.height'];

    if (width === undefined || height === undefined) {
      throw new DetoxRuntimeError(`Emulator with name ${avdName} has a corrupt config.ini file (${configFile}), try fixing it by recreating an emulator.`);
    }

    config['skin.name'] = `${width}x${height}`;
    fs.writeFileSync(configFile, ini.stringify(config));
  }
}

module.exports = { patchAvdSkinConfig };
