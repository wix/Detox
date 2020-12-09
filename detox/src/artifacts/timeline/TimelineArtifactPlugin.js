const _noop = require('lodash/noop');
const fs = require('fs-extra');
const ArtifactPlugin = require('../templates/plugin/ArtifactPlugin');
const FileArtifact = require('../templates/artifact/FileArtifact');
const { trace } = require('../../utils/trace');
const ChromeTracingExporter = require('../../utils/ChromeTracingExporter');

const traceStub = {
  startSection: _noop,
  endSection: _noop,
};

class TimelineArtifactPlugin extends ArtifactPlugin {
  constructor(config) {
    super(config);

    this._trace = this.enabled ? trace : traceStub;
    this._traceExporter = new ChromeTracingExporter({
      process: { id: 0, name: 'detox' },
      thread: { id: process.pid, name: `Worker #${process.pid}` },
    });
  }

  async onBootDevice(event) {
    this._deviceName = event.deviceId;
    return super.onBootDevice(event);
  }

  async onRunDescribeStart(suite) {
    const sectionName = (suite.name === 'ROOT_DESCRIBE_BLOCK' ? this._deviceName : suite.name);
    this._trace.startSection(sectionName);
    await super.onRunDescribeStart(suite);
  }

  async onRunDescribeFinish(suite) {
    const sectionName = (suite.name === 'ROOT_DESCRIBE_BLOCK' ? this._deviceName : suite.name);
    this._trace.endSection(sectionName);
    await super.onRunDescribeFinish(suite);
  }

  async onTestStart(testSummary) {
    this._trace.startSection(testSummary.title);
    await super.onTestStart(testSummary);
  }

  async onTestDone(testSummary) {
    this._trace.endSection(testSummary.title, {status: testSummary.status});
    await super.onTestDone(testSummary);
  }

  async onBeforeCleanup() {
    this._deviceName = null;

    if (!this.enabled) {
      return;
    }

    const traceLogPath = await this.api.preparePathForArtifact(`detox.trace.json`);
    const append = await this._logFileExists(traceLogPath);
    const data = this._traceExporter.export(trace.events, append);

    const fileArtifact = new FileArtifact({ temporaryData: data });
    await fileArtifact.save(traceLogPath, { append });
  }

  async _logFileExists(traceLogPath) {
    return fs.access(traceLogPath).then(() => true).catch(() => false);
  }

  /** @param {string} config */
  static parseConfig(config) {
    return {
      enabled: config === 'all',
    };
  }
}

module.exports = TimelineArtifactPlugin;
