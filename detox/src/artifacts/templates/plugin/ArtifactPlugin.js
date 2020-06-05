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
    this.context = { testSummary: null , suite: null};
    this.enabled = api.userConfig.enabled;
    this.keepOnlyFailedTestsArtifacts = api.userConfig.keepOnlyFailedTestsArtifacts;
    this.priority = 16;
    this._disableReason = '';
    this._hasFailingTests = false;
    this._finishedTests = false;
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
   * @param {Object} event.launchArgs - Mutable key-value pairs of args before the launch
   * @return {Promise<void>} - when done
   */
  async onBeforeLaunchApp(event) {
    Object.assign(this.context, {
      isAppReady: false,
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
   * @param {Object} event.launchArgs - key-value pairs of launch args
   * @param {number} event.pid - Process id of the running app
   * @return {Promise<void>} - when done
   */
  async onLaunchApp(event) {
    Object.assign(this.context, {
      bundleId: event.bundleId,
      launchArgs: event.launchArgs,
      pid: event.pid,
   });
  }

  /**
   * Hook that is called after app sends ready signal
   * over the web socket.
   *
   * @protected
   * @async
   * @param {Object} event - App ready event object
   * @param {string} event.deviceId - Current deviceId
   * @param {string} event.bundleId - Current bundleId
   * @param {number} event.pid - Process id of the running app
   * @return {Promise<void>} - when done
   */
  async onAppReady(event) {
    Object.assign(this.context, {
      isAppReady: true,
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
    });
  }

  /**
   * Hook that is supposed to be called before app is terminated
   *
   * @protected
   * @async
   * @param {Object} event - App termination event object
   * @param {string} event.deviceId - Current deviceId
   * @param {string} event.bundleId - Current bundleId
   * @return {Promise<void>} - when done
   */
  async onBeforeTerminateApp(event) {}

  /**
   * Hook that is supposed to be called after app has been terminated
   *
   * @protected
   * @async
   * @param {Object} event - App termination event object
   * @param {string} event.deviceId - Current deviceId
   * @param {string} event.bundleId - Terminated bundleId
   * @return {Promise<void>} - when done
   */
  async onTerminateApp(event) {
    Object.assign(this.context, {
      bundleId: '',
      launchArgs: null,
      pid: NaN,
      isAppReady: undefined,
    });
  }

  /**
   * Hook that is supposed to be called before app is uninstalled
   *
   * @protected
   * @async
   * @param {Object} event - App uninstall event object
   * @param {string} event.deviceId - Current deviceId
   * @param {string} event.bundleId - Current bundleId
   * @return {Promise<void>} - when done
   */
  async onBeforeUninstallApp(event) {}

  /**
   * Hook that is supposed to be called before device.shutdown() happens
   *
   * @protected
   * @async
   * @param {Object} event - Device shutdown event object
   * @param {string} event.deviceId - Current deviceId
   * @return {Promise<void>} - when done
   */
  async onBeforeShutdownDevice(event) {}

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
      deviceId: '',
      bundleId: '',
      launchArgs: null,
      pid: NaN,
      isAppReady: undefined,
    });
  }

  /**
   * Hook that is supposed to be called when an artifact has been created indirectly,
   * outside of lifecycle of the plugin.
   *
   * @protected
   * @async
   * @param {Object} event - Information about an indirectly created artifact
   * @param {string} event.name - Target name for the artifact
   * @param {Artifact} event.artifact - Artifact instance
   * @return {Promise<void>} - when done
   */
  async onCreateExternalArtifact(event) {}

  /**
   * Hook that is called before a test begins
   *
   * @protected
   * @async
   * @param {TestSummary} testSummary - has name of currently running test
   * @return {Promise<void>} - when done
   */
  async onTestStart(testSummary) {
    this.context.testSummary = testSummary;
  }

  /**
   * Hook that is called if a hook of a test fails
   * e.g.: beforeAll, beforeEach, afterEach, afterAll
   *
   * @protected
   * @async
   * @param {string} failureDetails.hook
   * @param {*} failureDetails.error
   * @return {Promise<void>} - when done
   */
  async onHookFailure(failureDetails) {
    this._hasFailingTests = true;
  }

  /**
   * Hook that is called if a test function fails
   *
   * @protected
   * @async
   * @param {*} failureDetails.error
   * @return {Promise<void>} - when done
   */
  async onTestFnFailure(failureDetails) {
    this._hasFailingTests = true;
  }

  /***
   * @protected
   * @async
   * @param {TestSummary} testSummary - has name and status of test that ran
   * @return {Promise<void>} - when done
   */
  async onTestDone(testSummary) {
    this.context.testSummary = testSummary;

    if (testSummary.status === 'failed') {
      this._hasFailingTests = true;
    }
  }

  /**
   * Hook that is called when test suite starts
   *
   * @protected
   * @async
   * @param {Suite} suite - has name of currently running test suite
   * @return {Promise<void>} - when done
   */
  async onRunDescribeStart(suite) {
    this.context.suite = suite;
  }

  /**
   * Hook that is called when test suite finishes
   *
   * @protected
   * @async
   * @param {Suite} suite - has name of currently running test suite
   * @return {Promise<void>} - when done
   */
  async onRunDescribeFinish(suite) {
    this.context.suite = null;
  }

  /**
   * Hook that is called when detox.cleanup() just begins
   *
   * @protected
   * @async
   * @return {Promise<void>} - when done
   */
  async onBeforeCleanup() {
    this.context.testSummary = null;
    this._finishedTests = true;
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
    this.onBeforeShutdownDevice = _.noop;
    this.onShutdownDevice = _.noop;
    this.onBeforeTerminateApp = _.noop;
    this.onTerminateApp = _.noop;
    this.onBeforeLaunchApp = _.noop;
    this.onLaunchApp = _.noop;
    this.onTestStart = _.noop;
    this.onHookFailure = _.noop;
    this.onTestFnFailure = _.noop;
    this.onTestDone = _.noop;
    this.onRunDescribeStart = _.noop;
    this.onRunDescribeFinish = _.noop;
    this.onBeforeCleanup = _.noop;
  }

  _logDisableWarning() {
    if (!this.enabled && this._disableReason) {
      log.warn({ event: 'PLUGIN_DISABLED' }, `Artifact plugin ${this.constructor.name} was disabled because ${this._disableReason}`);
    }
  }

  shouldKeepArtifactOfSession() {
    if (!this.enabled) {
      return false;
    }

    if (!this.keepOnlyFailedTestsArtifacts) {
      return true;
    }

    if (this._hasFailingTests) {
      return true;
    }

    if (this._finishedTests) {
      return false;
    }

    return undefined;
  }

  shouldKeepArtifactOfTest(testSummary) {
    if (!this.enabled) {
      return false;
    }

    if (this.keepOnlyFailedTestsArtifacts && testSummary.status !== 'failed') {
      return false;
    }

    return true;
  }
}

module.exports = ArtifactPlugin;
