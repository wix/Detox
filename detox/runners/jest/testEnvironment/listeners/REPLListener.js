const internals = require('../../../../internals');
const { enterREPL } = require('../../../../src/utils/repl');

const log = internals.log.child({ cat: 'lifecycle,jest-environment' });
const noop = () => {};

class REPLListener {
  constructor({ env }) {
    this._env = env;
  }

  async setup(_events, state) {
    const repl = internals.config.cli.repl;

    if (repl) {
      state.testTimeout = 2 * 60 * 60 * 1000; // 2 hours
    }

    if (repl !== 'auto') {
      Object.assign(this, {
        hook_failure: noop,
        test_fn_failure: noop,
      });
    }
  }

  async hook_failure({ error }) {
    await this._enterREPL(error);
  }

  async test_fn_failure({ error }) {
    await this._enterREPL(error);
  }

  async _enterREPL(error) {
    log.error(error);
    await enterREPL();
  }
}

module.exports = REPLListener;
