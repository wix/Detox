const _ = require('lodash');

const TIMELINE_CONTEXT_TYPES = require('./TimelineContextTypes');
const latestInstanceOf = (clazz) => _.last(clazz.mock.instances);

describe('TimelineArtifactPlugin', () => {
  const configMock = ({ enabled = true } = {}) => ({
    api: {
      userConfig: {
        enabled,
      },
      preparePathForArtifact: async path => path,
    },
  });

  let fs;
  let ChromeTracingExporter;
  let chromeTracingExporterObj;
  let FileArtifact;
  let fileArtifactObj;
  let trace;
  let TimelineArtifactPlugin;
  let uutEnabled;
  let uutDisabled;
  beforeEach(() => {
    jest.mock('fs-extra', () => ({
      access: jest.fn(),
    }));
    fs = require('fs-extra');

    jest.mock('../../utils/ChromeTracingExporter');
    ChromeTracingExporter = require('../../utils/ChromeTracingExporter');
    chromeTracingExporterObj = () => latestInstanceOf(ChromeTracingExporter);

    jest.mock('../templates/artifact/FileArtifact');
    FileArtifact = require('../templates/artifact/FileArtifact');
    fileArtifactObj = () => latestInstanceOf(FileArtifact);

    const { Trace: MockTrace } = jest.genMockFromModule('../../utils/trace');
    const mockTrace = new MockTrace();
    jest.mock('../../utils/trace', () => ({
      trace: mockTrace,
    }));
    trace = mockTrace;

    TimelineArtifactPlugin = require('./TimelineArtifactPlugin');
    uutEnabled = () => new TimelineArtifactPlugin(configMock({ enabled: true }));
    uutDisabled = () => new TimelineArtifactPlugin(configMock({ enabled: false }));
  });

  describe('onBootDevice', () => {
    const deviceId = 'testDeviceId';

    it('should set device ID into plugin\'s context', async () => {
      const uut = uutEnabled();
      await uut.onBootDevice({ deviceId });
      expect(uut.context.deviceId).toEqual(deviceId);
    });
  });

  describe('Describe block hooks', () => {
    const suite = {
      name: 'suite-name',
    };

    it('should trace a section-start with the suite name on describe-start', async () => {
      await uutEnabled().onRunDescribeStart(suite);
      expect(trace.startSection).toHaveBeenCalledWith(suite.name, { context: TIMELINE_CONTEXT_TYPES.DESCRIBE });
    });

    it('should save the suite in the plugin-context on describe-start', async () => {
      const uut = uutEnabled();
      await uut.onRunDescribeStart(suite);
      expect(uut.context.suite).toEqual(suite);
    });

    it('should trace a section-end with the suite name on describe-end', async () => {
      const uut = uutEnabled();
      await uut.onRunDescribeStart(suite);
      await uut.onRunDescribeFinish(suite);
      expect(trace.endSection).toHaveBeenCalledWith(suite.name, { context: TIMELINE_CONTEXT_TYPES.DESCRIBE });
    });

    it('should not trace anything if disabled', async () => {
      const uut = uutDisabled();
      await uut.onRunDescribeStart(suite);
      await uut.onRunDescribeFinish(suite);
      expect(trace.startSection).not.toHaveBeenCalled();
      expect(trace.endSection).not.toHaveBeenCalled();
    });

    it('should clear the suite from the plugin\'s context on describe-end', async () => {
      const uut = uutEnabled();
      await uut.onRunDescribeStart(suite);
      await uut.onRunDescribeFinish(suite);
      expect(uut.context.suite).toBeNull();
    });

    describe('For the root describe block', () => {
      const deviceId = 'deviceID-mock';
      const rootSuite = {
        name: 'ROOT_DESCRIBE_BLOCK',
      };

      it('should trace the root-section\'s start with the _device_ name', async () => {
        const uut = uutEnabled();
        await uut.onBootDevice({ deviceId });
        await uut.onRunDescribeStart(rootSuite);
        expect(trace.startSection).toHaveBeenCalledWith(deviceId, { context: TIMELINE_CONTEXT_TYPES.DESCRIBE });
        expect(trace.startSection).toHaveBeenCalledTimes(1);
      });

      it('should trace the root-section\'s end with the _device_ name', async () => {
        const uut = uutEnabled();
        await uut.onBootDevice({ deviceId });
        await uut.onRunDescribeStart(rootSuite);
        await uut.onRunDescribeFinish(rootSuite);
        expect(trace.endSection).toHaveBeenCalledWith(deviceId, { context: TIMELINE_CONTEXT_TYPES.DESCRIBE });
        expect(trace.endSection).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Test block hooks', () => {
    const testSummary = {
      title: 'test-name-mock',
    };

    it('should trace a section-start with the test name on test-start', async () => {
      const uut = uutEnabled();
      await uut.onTestStart(testSummary);
      expect(trace.startSection).toHaveBeenCalledWith(testSummary.title, {
        title: 'test-name-mock',
        context: TIMELINE_CONTEXT_TYPES.TEST
      });
    });

    it('should save the test summary in the plugin\'s context on test-start', async () => {
      const uut = uutEnabled();
      await uut.onTestStart(testSummary);
      expect(uut.context.testSummary).toEqual(testSummary);
    });

    it('should trace a section-end with the test name on test-end', async () => {
      const _testSummary = { ...testSummary, status: 'alright!' };
      await uutEnabled().onTestDone(_testSummary);
      expect(trace.endSection).toHaveBeenCalledWith(testSummary.title, {
        title: 'test-name-mock',
        status: 'alright!',
        context: TIMELINE_CONTEXT_TYPES.TEST
      });
    });

    it('should not trace anything if disabled', async () => {
      const _testSummary = { ...testSummary, status: 'alright!' };
      const uut = uutDisabled();
      await uut.onTestStart(testSummary);
      await uut.onTestDone(_testSummary);
      expect(trace.startSection).not.toHaveBeenCalled();
      expect(trace.endSection).not.toHaveBeenCalled();
    });

    it('should save the test summary from the plugin\'s context on test-end', async () => {
      const _testSummary = { ...testSummary, status: 'alright!' };
      const uut = uutEnabled();
      await uut.onTestDone(_testSummary);
      expect(uut.context.testSummary).toEqual(_testSummary);
    });
  });

  describe('onBeforeCleanup', () => {
    const expectedArtifactPath = `detox.trace.json`;

    const givenArtifactFileNotExists = () => fs.access.mockImplementation(async () => {
      throw new Error('Make uutEnabled think the file doesnt already exist');
    });
    const givenArtifactFileAlreadyExists = () => fs.access.mockResolvedValue(undefined);
    const givenExportedTraceDataResult = (result) => chromeTracingExporterObj().export.mockReturnValue(result);

    it('should create artifact with exported trace data', async () => {
      const uut = uutEnabled();
      const exportedData = JSON.stringify({ mocked: 'mocked data' });
      givenArtifactFileNotExists();
      givenExportedTraceDataResult(exportedData);

      await uut.onBeforeCleanup();

      expect(FileArtifact).toHaveBeenCalledWith({ temporaryData: exportedData });
      expect(fileArtifactObj().save).toHaveBeenCalledWith(expectedArtifactPath, { append: false });
    });

    it('should append exported data if artifact file already exists', async () => {
      const uut = uutEnabled();
      const exportedData = JSON.stringify({ mocked: 'mocked data' });
      givenArtifactFileAlreadyExists();
      givenExportedTraceDataResult(exportedData);

      await uut.onBeforeCleanup();

      expect(fileArtifactObj().save).toHaveBeenCalledWith(expectedArtifactPath, { append: true });
    });

    it('should not save artifact if disabled', async () => {
      const uut = uutDisabled();
      const exportedData = JSON.stringify({ mocked: 'mocked data' });
      givenArtifactFileNotExists();
      givenExportedTraceDataResult(exportedData);

      await uut.onBeforeCleanup();

      expect(chromeTracingExporterObj().export).not.toHaveBeenCalled();
      expect(fileArtifactObj()).toBeUndefined();
      expect(fs.access).not.toHaveBeenCalled();
    });

    it('should properly init the trace-events exporter, and use the jest worker ID for thread-ID', async () => {
      process.env.JEST_WORKER_ID = '102030';
      const expectedThreadId = '102030';
      const expectedThreadName = `Worker #102030`;
      const uut = uutEnabled();

      const exportedData = JSON.stringify({ mocked: 'mocked data' });
      givenArtifactFileNotExists();
      givenExportedTraceDataResult(exportedData);

      await uut.onBeforeCleanup();

      expect(ChromeTracingExporter).toHaveBeenCalledWith({
        process: { id: 0, name: 'detox' },
        thread: { id: expectedThreadId, name: expectedThreadName },
      });
    });

    it('should resort to our pid as the exporter\'s thread-ID if not running using Jest', async () => {
      process.env.JEST_WORKER_ID = '';
      const expectedThreadId = process.pid;
      const expectedThreadName = `Worker #${process.pid}`;
      const uut = uutEnabled();

      const exportedData = JSON.stringify({ mocked: 'mocked data' });
      givenArtifactFileNotExists();
      givenExportedTraceDataResult(exportedData);

      await uut.onBeforeCleanup();

      expect(ChromeTracingExporter).toHaveBeenCalledWith(expect.objectContaining({
        thread: { id: expectedThreadId, name: expectedThreadName },
      }));
    });

    it('should use trace events as inpute to data exporter', async () => {
      trace.events = [
        { name: 'mock-event', type: 'start', ts: 1234 },
        { name: 'mock-event', type: 'end', ts: 1235 },
      ];
      const uut = uutEnabled();

      givenArtifactFileNotExists();
      givenExportedTraceDataResult('mock');

      await uut.onBeforeCleanup();

      expect(chromeTracingExporterObj().export).toHaveBeenCalledWith(trace.events, false);
    });

    it('should pass in append=true to exporter if artifact file already exists', async () => {
      trace.events = [];
      const uut = uutEnabled();

      givenArtifactFileAlreadyExists();
      givenExportedTraceDataResult('mock');

      await uut.onBeforeCleanup();

      expect(chromeTracingExporterObj().export).toHaveBeenCalledWith([], true);
    });

    describe('In a stub-like operational mode', () => {
      let uut;
      beforeEach(() => {
        uut = new TimelineArtifactPlugin({
          ...configMock({ enabled: true }),
          useFakeTimestamps: true,
        });
      });

      it('should rewrite the timeline events with fake (deterministic) timestamps', async () => {
        const events = [
          { type: 'init', ts: 1233 },
          { name: 'mock-event', type: 'start', ts: 1234 },
          { name: 'mock-event', type: 'end', ts: 1235 },
        ];
        const expectedEvents = [
          { type: 'init', ts: 1000 },
          { name: 'mock-event', type: 'start', ts: 1100 },
          { name: 'mock-event', type: 'end', ts: 1200 },
        ];
        trace.events = events;

        givenArtifactFileNotExists();
        givenExportedTraceDataResult('mock');

        await uut.onBeforeCleanup();

        expect(chromeTracingExporterObj().export).toHaveBeenCalledWith(expectedEvents, false);
      });
    });
  });

  describe('parseConfig', () => {
    let parseConfig;
    beforeEach(() => {
      parseConfig = TimelineArtifactPlugin.parseConfig;
    });

    it('should enable plugin if config = all', () =>
      expect(parseConfig('all').enabled).toBe(true));

    it('should disable plugin if config != all', () =>
      expect(parseConfig('none').enabled).toBe(false));
  });
});
