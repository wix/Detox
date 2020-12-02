const _ = require('lodash');

const latestInstanceOf = (clazz) => _.last(clazz.mock.instances);

describe('TimelineArtifactPlugin', () => {
  const configMock = ({enabled = true} = {}) => ({
    api: {
      userConfig: {
        enabled,
      },
      preparePathForArtifact: async path => path,
    },
  });

  let fs;
  let ChromeTracingParser;
  let chromeTracingParserObj;
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

    jest.mock('../../utils/ChromeTracingParser');
    ChromeTracingParser = require('../../utils/ChromeTracingParser');
    chromeTracingParserObj = () => latestInstanceOf(ChromeTracingParser);

    jest.mock('../templates/artifact/FileArtifact');
    FileArtifact = require('../templates/artifact/FileArtifact');
    fileArtifactObj = () => latestInstanceOf(FileArtifact);

    const { Trace } = jest.genMockFromModule('../../utils/trace');
    const mockTrace = new Trace();
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
      expect(trace.startSection).toHaveBeenCalledWith(suite.name);
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
      expect(trace.endSection).toHaveBeenCalledWith(suite.name);
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
        expect(trace.startSection).toHaveBeenCalledWith(deviceId);
        expect(trace.startSection).toHaveBeenCalledTimes(1);
      });

      it('should trace the root-section\'s end with the _device_ name', async () => {
        const uut = uutEnabled();
        await uut.onBootDevice({ deviceId });
        await uut.onRunDescribeStart(rootSuite);
        await uut.onRunDescribeFinish(rootSuite);
        expect(trace.endSection).toHaveBeenCalledWith(deviceId);
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
      expect(trace.startSection).toHaveBeenCalledWith(testSummary.title);
    });

    it('should save the test summary in the plugin\'s context on test-start', async () => {
      const uut = uutEnabled();
      await uut.onTestStart(testSummary);
      expect(uut.context.testSummary).toEqual(testSummary);
    });

    it('should trace a section-end with the test name on test-end', async () => {
      const _testSummary = { ...testSummary, status: 'alright!' };
      await uutEnabled().onTestDone(_testSummary);
      expect(trace.endSection).toHaveBeenCalledWith(testSummary.title, { status: 'alright!' });
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
    const givenParsedTraceDataResult = (result) => chromeTracingParserObj().parse.mockReturnValue(result);

    it('should create artifact with parsed trace data', async () => {
      const uut = uutEnabled();
      const parsedTraceData = JSON.stringify({ mocked: 'mocked data' });
      givenArtifactFileNotExists();
      givenParsedTraceDataResult(parsedTraceData);

      await uut.onBeforeCleanup();

      expect(FileArtifact).toHaveBeenCalledWith({ temporaryData: parsedTraceData });
      expect(fileArtifactObj().save).toHaveBeenCalledWith(expectedArtifactPath, { append: false });
    });

    it('should append parsed data if artifact file already exists', async () => {
      const uut = uutEnabled();
      const parsedTraceData = JSON.stringify({ mocked: 'mocked data' });
      givenArtifactFileAlreadyExists();
      givenParsedTraceDataResult(parsedTraceData);

      await uut.onBeforeCleanup();

      expect(fileArtifactObj().save).toHaveBeenCalledWith(expectedArtifactPath, { append: true });
    });

    it('should not save artifact if disabled', async () => {
      const uut = uutDisabled();
      const parsedTraceData = JSON.stringify({ mocked: 'mocked data' });
      givenArtifactFileNotExists();
      givenParsedTraceDataResult(parsedTraceData);

      await uut.onBeforeCleanup();

      expect(chromeTracingParserObj().parse).not.toHaveBeenCalled();
      expect(fileArtifactObj()).toBeUndefined();
      expect(fs.access).not.toHaveBeenCalled();
    });

    it('should properly init the trace-events parser', async () => {
      const expectedThreadId = process.pid;
      const expectedThreadName = `Worker #${process.pid}`;
      const uut = uutEnabled();

      const parsedTraceData = JSON.stringify({ mocked: 'mocked data' });
      givenArtifactFileNotExists();
      givenParsedTraceDataResult(parsedTraceData);

      await uut.onBeforeCleanup();

      expect(ChromeTracingParser).toHaveBeenCalledWith({
        process: { id: 0, name: 'detox' },
        thread: { id: expectedThreadId, name: expectedThreadName },
      })
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
