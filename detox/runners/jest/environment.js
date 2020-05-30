const NodeEnvironment = require('jest-environment-node'); // eslint-disable-line node/no-extraneous-require
const argparse = require('../../src/utils/argparse');
const timely = require('../../src/utils/timely');
const DetoxCoreListener = require('./listeners/DetoxCoreListener');
const WorkerAssignReporter = require('./listeners/WorkerAssignReporter');
const SpecReporter = require('./listeners/SpecReporter');

/**
 * @see https://www.npmjs.com/package/jest-circus#overview
 */
class DetoxEnvironment extends NodeEnvironment {
  constructor(config) {
    super(config);

    this._hookTimeout = this.constructor.initTimeout;
    this._enabledListeners = {};
    /** @protected */
    this.circusEventListeners = [];
  }

  async setup() {
    await super.setup();

    this.detox = require('../../src')._setGlobal(this.global);

    try {
      await this._timely(() => this.initDetox());
    } catch (e) {
      this._initError = e;
      throw e;
    }

    this._expect = this.global.expect;
  }

  async handleTestEvent(event, state) {
    this._hookTimeout = state.testTimeout;

    if (event.name === 'setup') {
      await this._onSetup(event, state);
    }

    await this._notifyListeners(event, state);
  }

  async teardown() {
    await this._timely(() => this.cleanupDetox());
    await super.teardown();
  }

  _timely(fn) {
    return timely(fn, this._hookTimeout, () => {
      return new Error(`Exceeded timeout of ${this._hookTimeout}ms.`);
    })();
  }

  _onSetup(event, state) {
    if (this._expect) {
      this.global.expect = this._expect;
      delete this._expect;
    }

    if (this._initError) {
      state.unhandledErrors.push(this._initError);
      this._initError = null;
    }
  }

  async _notifyListeners(event, state) {
    const name = event.name;

    for (const listener of this.circusEventListeners) {
      if (typeof listener[name] === 'function') {
        await listener[name](event, state);
      }
    }
  }

  /** @protected */
  async initDetox() {
    const detox = await this.detox.init();

    this.circusEventListeners.push(new DetoxCoreListener({ detox }));

    if (this._enabledListeners['WorkerAssignReporter']) {
      this.circusEventListeners.push(new WorkerAssignReporter({ detox }));
    }

    if (this._enabledListeners['SpecReporter']) {
      if (`${argparse.getArgValue('reportSpecs')}` === 'true') {
        this.circusEventListeners.push(new SpecReporter());
      }
    }
  }

  /** @protected */
  async cleanupDetox() {
    await this.detox.cleanup();
  }

  /** @protected */
  enableListener(type) {
    switch (type) {
      case 'WorkerAssignReporter':
      case 'SpecReporter':
        this._enabledListeners[type] = true;
        break;
      default:
        throw new Error(`Cannot add unsupported Circus listener: ${type}`);
    }
  }
}

DetoxEnvironment.initTimeout = 300000;

module.exports = DetoxEnvironment;
