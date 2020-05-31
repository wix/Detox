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

    this._hookTimeout = this.constructor.initTimeout || 300000;
    this._enabledListeners = {};
    /** @protected */
    this.circusEventListeners = [];
  }

  get detox() {
    return require('../../src')._setGlobal(this.global);
  }

  async handleTestEvent(event, state) {
    await this._timely(async () => {
      if (event.name === 'setup') {
        await this._onSetup();
      }

      await this._notifyListeners(event, state);

      if (event.name === 'teardown') {
        await this.cleanupDetox();
      }
    });

    this._hookTimeout = state.testTimeout;
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

  async _notifyListeners(event, state) {
    const name = event.name;

    for (const listener of this.circusEventListeners) {
      if (typeof listener[name] === 'function') {
        await listener[name](event, state);
      }
    }
  }

  async _onSetup() {
    const detox = await this.initDetox();

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
  async initDetox() {
    return this.detox.init();
  }

  /** @protected */
  async cleanupDetox() {
    return this.detox.cleanup();
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

module.exports = DetoxEnvironment;
