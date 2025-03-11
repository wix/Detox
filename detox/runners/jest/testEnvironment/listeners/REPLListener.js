const internals = require('../../../../internals');
const { enterREPL } = require('../../../../src/utils/repl');

const log = internals.log.child({ cat: 'lifecycle,jest-environment' });

class REPLListener {
  constructor({ env }) {
    this._env = env;
    this._auto = false;
  }

  async setup(events, state) {
    const repl = internals.config.cli.repl;

    this._auto = repl === 'auto';
    if (repl) {
      state.testTimeout = 2 * 60 * 60 * 1000; // 2 hours
    }
  }

  async hook_failure({ error }) {
    await this._enterREPL(error);
  }

  async test_fn_failure({ error }) {
    await this._enterREPL(error);
  }

  async _enterREPL(error) {
    if (!this._auto) {
      return;
    }

    if (error) {
      log.error(error);
    }

    await enterREPL();
  }
}

module.exports = REPLListener;
