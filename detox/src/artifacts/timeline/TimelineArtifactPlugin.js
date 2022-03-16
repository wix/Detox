const fs = require('fs-extra');
const _noop = require('lodash/noop');

const ChromeTracingExporter = require('../../utils/ChromeTracingExporter');
const fakeTimestampsProvider = require('../../utils/fakeTimestampsProvider');
const { trace } = require('../../utils/trace');
const FileArtifact = require('../templates/artifact/FileArtifact');
const ArtifactPlugin = require('../templates/plugin/ArtifactPlugin');

const traceNoop = {
  startSection: _noop,
  endSection: _noop,
};

class TimelineArtifactPlugin extends ArtifactPlugin {
  constructor(config) {
    super(config);
    this._useFakeTimestamps = config.useFakeTimestamps;

    const threadId = process.env.JEST_WORKER_ID || process.pid;
    this._trace = this.enabled ? trace : traceNoop;
    this._traceExporter = new ChromeTracingExporter({
      process: { id: 0, name: 'detox' },
      thread: { id: threadId, name: `Worker #${threadId}` },
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
    this._trace.endSection(testSummary.title, { status: testSummary.status });
    await super.onTestDone(testSummary);
  }

  async onBeforeCleanup() {
    this._deviceName = null;

    if (!this.enabled) {
      return;
    }

    const traceLogPath = await this.api.preparePathForArtifact(`detox.trace.json`);
    const append = await this._logFileExists(traceLogPath);
    const events = this._useFakeTimestamps ? this._transformEventTimestamps(trace.events) : trace.events;
    const data = this._traceExporter.export(events, append);

    const fileArtifact = new FileArtifact({ temporaryData: data });
    await fileArtifact.save(traceLogPath, { append });
  }

  async _logFileExists(traceLogPath) {
    return fs.access(traceLogPath).then(() => true).catch(() => false);
  }

  _transformEventTimestamps(events) {
    return events.map((event) => ({
      ...event,
      ts: fakeTimestampsProvider(),
    }));
  }

  /** @param {string} config */
  static parseConfig(config) {
    return {
      enabled: config === 'all',
    };
  }
}

module.exports = TimelineArtifactPlugin;
