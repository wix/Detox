const _ = require('lodash');
const log = require('../../../utils/logger').child({ __filename });

/***
 * Almost non-opinionated building block for any artifact type
 * You might derive from it if your workflow extremely differs from
 * the already existing artifact plugin templates.
 *
 * @abstract
 */
class ArtifactPlugin {
  constructor({ api }) {
    this.api = api;
    this.context = {};
    this.enabled = false;
    this.keepOnlyFailedTestsArtifacts = false;
    this._disableReason = '';
  }

  get name() {
    return this.constructor.name;
  }

  disable(reason) {
    if (!this.enabled) {
      return;
    }

    this.enabled = false;
    this._disableReason = reason;
    this._logDisableWarning();
  }

  /**
   * Hook that is called inside device.launchApp() before
   * the current app on the current device is relaunched.
   *
   * @protected
   * @async
   * @param {Object} event - Launch app event object
   * @param {string} event.deviceId - Current deviceId
   * @param {string} event.bundleId - Current bundleId
   * @return {Promise<void>} - when done
   */
  async onBeforeLaunchApp(event) {
    Object.assign(this.context, {
      bundleId: event.bundleId,
      deviceId: event.deviceId,
      pid: NaN,
    });
  }

  /**
   * Hook that is called inside device.launchApp() and
   * provides a new pid for the relaunched app for the
   * artifacts that are dependent on pid.
   *
   * @protected
   * @async
   * @param {Object} event - Launch app event object
   * @param {string} event.deviceId - Current deviceId
   * @param {string} event.bundleId - Current bundleId
   * @param {number} event.pid - Process id of the running app
   * @return {Promise<void>} - when done
   */
  async onLaunchApp(event) {
    Object.assign(this.context, {
      bundleId: event.bundleId,
      deviceId: event.deviceId,
      pid: event.pid,
   });
  }

  /**
   * Hook that is supposed to be called from device.boot()
   *
   * @protected
   * @async
   * @param {Object} event - Device boot event object
   * @param {string} event.deviceId - Current deviceId
   * @param {boolean} event.coldBoot - true, if the device gets turned on from the shutdown state.
   * @return {Promise<void>} - when done
   */
  async onBootDevice(event) {
    Object.assign(this.context, {
      deviceId: event.deviceId,
      bundleId: '',
      pid: NaN,
    });
  }

  /**
   * Hook that is supposed to be called from device.shutdown()
   *
   * @protected
   * @async
   * @param {Object} event - Device shutdown event object
   * @param {string} event.deviceId - Current deviceId
   * @return {Promise<void>} - when done
   */
  async onShutdownDevice(event) {
    Object.assign(this.context, {
      deviceId: event.deviceId,
      bundleId: '',
      pid: NaN,
    });
  }

  /**
   * Hook that is called before any test begins
   *
   * @protected
   * @async
   * @return {Promise<void>} - when done
   */
  async onBeforeAll() {}

  /**
   * Hook that is called before a test begins
   *
   * @protected
   * @async
   * @param {TestSummary} testSummary - has name of currently running test
   * @return {Promise<void>} - when done
   */
  async onBeforeEach(testSummary) {}

  /***
   * @protected
   * @async
   * @param {TestSummary} testSummary - has name and status of test that ran
   * @return {Promise<void>} - when done
   */
  async onAfterEach(testSummary) {}

  /**
   * Hook that is called after all tests run
   *
   * @protected
   * @async
   * @return {Promise<void>} - when done
   */
  async onAfterAll() {
    this._logDisableWarning();
  }

  /**
   * Hook that is called on SIGINT and SIGTERM
   *
   * @protected
   * @async
   * @return {Promise<void>} - when done
   */
  async onTerminate() {
    this.disable('it was terminated by SIGINT or SIGTERM');

    this.onTerminate = _.noop;
    this.onBootDevice = _.noop;
    this.onShutdownDevice = _.noop;
    this.onBeforeLaunchApp = _.noop;
    this.onLaunchApp = _.noop;
    this.onBeforeAll = _.noop;
    this.onBeforeEach = _.noop;
    this.onAfterEach = _.noop;
    this.onAfterAll = _.noop;
  }

  _logDisableWarning() {
    if (!this.enabled && this._disableReason) {
      log.warn({ event: 'PLUGIN_DISABLED' }, `Artifact plugin ${this.constructor.name} was disabled because ${this._disableReason}`);
    }
  }

  shouldKeepArtifactOfTest(testSummary) {
    if (this.keepOnlyFailedTestsArtifacts && testSummary.status !== 'failed') {
      return false;
    }

    return true;
  }
}

module.exports = ArtifactPlugin;