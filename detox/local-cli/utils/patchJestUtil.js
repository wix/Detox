const fs = require('fs');
const path = require('path');

const resolveFrom = require('resolve-from');

const log = require('../../src/utils/logger').child({ cat: 'jest-patch' });

function patchJestUtil() {
  try {
    const jestUtilPath = resolveFrom(process.cwd(), 'jest-util/package.json');
    const isInteractivePath = path.join(path.dirname(jestUtilPath), 'build/isInteractive.js');

    if (!fs.existsSync(isInteractivePath)) {
      log.warn('Could not find node_modules/jest-util/build/isInteractive.js to patch!');
      return;
    }

    const content = fs.readFileSync(isInteractivePath, 'utf8');
    if (!content.includes('DETOX_REPL')) {
      const patchedContent = content.replace(
        "process.env.TERM !== 'dumb'",
        "process.env.TERM !== 'dumb' && /* patched by Detox */ !process.env.DETOX_REPL"
      );
      fs.writeFileSync(`${isInteractivePath}.bak`, content);
      fs.writeFileSync(isInteractivePath, patchedContent);
      log.info('Successfully patched jest-util for REPL support');
    }
  } catch (error) {
    log.warn({ err: error }, 'Failed to patch jest-util for REPL support');
  }
}

module.exports = patchJestUtil;
