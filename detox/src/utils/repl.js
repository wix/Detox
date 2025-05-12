const repl = require('node:repl');

const log = require('../utils/logger').child({ cat: 'repl' });

async function enterREPL(context = {}) {
  log.info('Entering Detox REPL...\nType .help to see available commands');

  const replServer = repl.start({
    prompt: 'detox> ',
    useColors: true,
    useGlobal: true,
    preview: true,
    breakEvalOnSigint: true,
  });

  // Add Detox globals
  const detox = require('../../index');
  Object.assign(replServer.context, detox);

  // Add user-provided context
  if (typeof context === 'object') {
    Object.assign(replServer.context, context);
  }

  // Define .dumpxml command
  replServer.defineCommand('dumpxml', {
    help: 'Print view hierarchy XML',
    async action() {
      this.clearBufferedCommand();
      try {
        const xml = await detox.device.generateViewHierarchyXml();
        if (xml) {
          log.info(xml);
        }
      } catch (error) {
        log.error('Failed to generate view hierarchy.\n%s', error);
      }
      this.displayPrompt();
    }
  });

  // Define .ai command for natural language interaction
  replServer.defineCommand('pilot', {
    help: 'Execute natural language command (e.g. .pilot Tap on login button)',
    async action(input) {
      this.clearBufferedCommand();
      try {
        if (!input || !input.trim()) {
          log.warn('Please provide a valid command. Example: .pilot Tap on login button');
        } else {
          await detox.pilot.perform(input);
        }
      } catch (error) {
        log.error('Failed to execute Detox Pilot command.\n%s', error);
      }
      this.displayPrompt();
    }
  });

  return new Promise((resolve) => replServer.on('exit', resolve));
}

module.exports = {
  enterREPL,
};
