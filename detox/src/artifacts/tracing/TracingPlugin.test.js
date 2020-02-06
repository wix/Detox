const TracingPlugin = require('./TracingPlugin');

describe('TracingPlugin', () => {
  const MockConfig = () => {
    const config = {
      api: {
        userConfig: {},
        preparePathForArtifact: path => path,
      },
    };

    return {config}
  };

  const configMock = {
    api: {
      userConfig: {},
      preparePathForArtifact: async path => path,
    },
  };

  const MockTrace = (data = '') => {
    const mockProcess = {};
    const mockThread = {};
    const mockEvent = {};

    class MockTraceClass {
      startProcess({id, name}) {
        mockProcess.id = id;
        mockProcess.name = name;

        return this;
      }

      startThread({id, name}) {
        mockThread.id = id;
        mockThread.name = name;

        return this;
      }

      beginEvent(name, args) {
        mockEvent.name = name;
        mockEvent.type = 'begin';
        mockEvent.args = args;

        return this;
      }

      finishEvent(name, args) {
        mockEvent.name = name;
        mockEvent.type = 'end';
        mockEvent.args = args;

        return this;
      }

      traces({prefix}) {
        return prefix + data;
      }
    }

    return {MockTraceClass, mockProcess, mockThread, mockEvent};
  };

  const MockFileArtifact = (existingData = '') => {
    const mockFile = {};

    class MockFileArtifactClass {
      constructor({temporaryData}) {
        mockFile.data = existingData + temporaryData;
      }

      save(path, {append}) {
        mockFile.path = path;
        mockFile.append = append;
      }
    }

    return {MockFileArtifactClass, mockFile};
  };

  const mockFs = accessFnMock => ({
    access: accessFnMock,
  });

  describe('constructor', () => {
    it('should not fail, if dependencies were not provided', () => {
      const constructor = () => new TracingPlugin(configMock, undefined);

      expect(constructor).not.toThrow();
    });

    it('should start trace process', () => {
      const pid = 'mockPid';
      const processName = 'mockName';
      const {MockTraceClass, mockProcess} = MockTrace();

      new TracingPlugin(configMock, {Trace: MockTraceClass, pid, processName});

      expect(mockProcess.id).toBe(pid);
      expect(mockProcess.name).toBe(processName);
    });
  });

  describe('onBootDevice', () => {
    it('should start trace thread', () => {
      const {MockTraceClass, mockThread} = MockTrace();
      const deviceId = 'testDeviceId';
      const type = 'testDeviceType';

      const tracingPlugin = new TracingPlugin(configMock, {Trace: MockTraceClass});

      tracingPlugin.onBootDevice({deviceId, type});

      expect(mockThread.id).toBe(deviceId);
      expect(mockThread.name).toBe(type);
    });
  });

  describe('onSuiteStart', () => {
    it('should begin trace event', () => {
      const deviceId = 'testDeviceId';
      const {MockTraceClass, mockEvent, mockThread} = MockTrace();
      const name = 'testSuiteName';

      const tracingPlugin = new TracingPlugin(configMock, {Trace: MockTraceClass});
      tracingPlugin.onBootDevice({deviceId});
      tracingPlugin.onSuiteStart({name});

      expect(mockEvent.name).toBe(name);
      expect(mockEvent.type).toBe('begin');
      expect(mockEvent.args).toEqual({deviceId: mockThread.id});
    });
  });

  describe('onSuiteEnd', () => {
    it('should finish trace event', () => {
      const {MockTraceClass, mockEvent} = MockTrace();
      const name = 'testSuiteName';

      const tracingPlugin = new TracingPlugin(configMock, {Trace: MockTraceClass});

      tracingPlugin.onSuiteEnd({name});

      expect(mockEvent.name).toBe(name);
      expect(mockEvent.type).toBe('end');
    });
  });

  describe('onTestStart', () => {
    it('should begin trace event', () => {
      const {MockTraceClass, mockEvent} = MockTrace();
      const title = 'testName';

      const tracingPlugin = new TracingPlugin(configMock, {Trace: MockTraceClass});

      tracingPlugin.onTestStart({title});

      expect(mockEvent.name).toBe(title);
      expect(mockEvent.type).toBe('begin');
    });
  });

  describe('onTestDone', () => {
    it('should finish trace event', () => {
      const {MockTraceClass, mockEvent} = MockTrace();
      const title = 'testName';
      const status = 'testStatus';

      const tracingPlugin = new TracingPlugin(configMock, {Trace: MockTraceClass});

      tracingPlugin.onTestDone({title, status});

      expect(mockEvent.name).toBe(title);
      expect(mockEvent.type).toBe('end');
      expect(mockEvent.args).toEqual({status});
    });
  });

  describe('onBeforeCleanup', () => {
    it('should create log file starting with [', async() => {
      const mockData = 'mockTrace';
      const {MockTraceClass} = MockTrace(mockData);
      const {config} = MockConfig();
      const {MockFileArtifactClass, mockFile} = MockFileArtifact();
      const mockPid = 'testPid';

      const tracingPlugin = new TracingPlugin(config, {
        Trace: MockTraceClass, FileArtifact: MockFileArtifactClass, pid: mockPid, fs: mockFs(async() => {throw new Error()}),
      });

      await tracingPlugin.onBeforeCleanup();

      expect(mockFile.path).toBe(`detox_pid_${mockPid}.trace.json`);
      expect(mockFile.append).toBe(true);
      expect(mockFile.data).toBe(`[${mockData}`);
    });

    it('should append to an existing log file starting with ,', async() => {
      const mockData = 'mockTrace';
      const mockExistingData = 'mockExistingTrace';
      const {MockTraceClass} = MockTrace(mockData);
      const {config} = MockConfig();
      const {MockFileArtifactClass, mockFile} = MockFileArtifact(mockExistingData);
      const mockPid = 'testPid';

      const tracingPlugin = new TracingPlugin(config, {
        Trace: MockTraceClass, FileArtifact: MockFileArtifactClass, pid: mockPid, fs: mockFs(async() => {}),
      });

      await tracingPlugin.onBeforeCleanup();

      expect(mockFile.path).toBe(`detox_pid_${mockPid}.trace.json`);
      expect(mockFile.append).toBe(true);
      expect(mockFile.data).toBe(`${mockExistingData},${mockData}`);
    });
  });
});
