describe('TracingPlugin', () => {
  const configMock = {
    api: {
      userConfig: {},
      preparePathForArtifact: async path => path,
    },
  };

  class MockTraceClass {
    constructor() {
      Object.assign(this, traceMock);
      this.startProcess.mockReturnValue(this);
      this.startThread.mockReturnValue(this);
      this.beginEvent.mockReturnValue(this);
      this.finishEvent.mockReturnValue(this);
    }
  }

  let traceMock;
  beforeEach(() => {
    const Trace = jest.genMockFromModule('./Trace');
    traceMock = new Trace();
    jest.mock('./Trace', () => MockTraceClass);
  });

  class MockFileArtifactClass {
    constructor() {
      fileArtifactMock.ctor(...arguments);
      Object.assign(this, fileArtifactMock);
    }
  }

  let fileArtifactMock;
  beforeEach(() => {
    const FileArtifacts = jest.genMockFromModule('../templates/artifact/FileArtifact');
    fileArtifactMock = new FileArtifacts();
    fileArtifactMock.ctor = jest.fn();
    jest.mock('../templates/artifact/FileArtifact', () => MockFileArtifactClass);
  });

  let fs;
  let TracingPlugin;
  beforeEach(() => {
    jest.mock('fs-extra', () => ({
      access: jest.fn(),
    }));
    fs = require('fs-extra');

    TracingPlugin = require('./TracingPlugin');
  });

  describe('constructor', () => {
    it('should start trace process', () => {
      const pid = 'mockPid';
      const processName = 'mockName';

      new TracingPlugin({...configMock, pid, processName});

      expect(traceMock.startProcess).toHaveBeenCalledWith({id: pid, name: processName});
    });
  });

  describe('onBootDevice', () => {
    it('should start trace thread', async () => {
      const deviceId = 'testDeviceId';
      const type = 'testDeviceType';

      const tracingPlugin = new TracingPlugin(configMock);
      await tracingPlugin.onBootDevice({deviceId, type});

      expect(traceMock.startThread).toHaveBeenCalledWith({id: deviceId, name: type});
    });
  });

  describe('onSuiteStart', () => {
    it('should begin trace event', async () => {
      const deviceId = 'testDeviceId';
      const name = 'testSuiteName';

      const tracingPlugin = new TracingPlugin(configMock);
      await tracingPlugin.onBootDevice({deviceId});
      await tracingPlugin.onSuiteStart({name});

      expect(traceMock.beginEvent).toHaveBeenCalledWith(name, {deviceId});
    });
  });

  describe('onSuiteEnd', () => {
    it('should finish trace event', async () => {
      const name = 'testSuiteName';

      const tracingPlugin = new TracingPlugin(configMock);
      await tracingPlugin.onSuiteEnd({name});

      expect(traceMock.finishEvent).toHaveBeenCalledWith(name);
    });
  });

  describe('onTestStart', () => {
    it('should begin trace event', async () => {
      const title = 'testName';

      const tracingPlugin = new TracingPlugin(configMock);
      await tracingPlugin.onTestStart({title});

      expect(traceMock.beginEvent).toHaveBeenCalledWith(title);
    });
  });

  describe('onTestDone', () => {
    it('should finish trace event', () => {
      const title = 'testName';
      const status = 'testStatus';

      const tracingPlugin = new TracingPlugin(configMock);
      tracingPlugin.onTestDone({title, status});

      expect(traceMock.finishEvent).toHaveBeenCalledWith(title, {status});
    });
  });

  describe('onBeforeCleanup', () => {
    const mockArtifactFileNotExists = () => {
      fs.access.mockImplementation(async () => {
        throw new Error('Make uut think the file doesnt already exist');
      });
    };

    const mockArtifactFileAlreadyExists = () => {
      fs.access.mockResolvedValue(undefined);
    };

    it('should create log file starting with [', async () => {
      mockArtifactFileNotExists();

      const pid = 'testPid';
      const artifactPath = 'detox_pid_testPid.trace.json';

      const tracingPlugin = new TracingPlugin({...configMock, pid});
      await tracingPlugin.onBeforeCleanup();

      expect(traceMock.traces).toHaveBeenCalledWith({prefix: '['});
      expect(fileArtifactMock.save).toHaveBeenCalledWith(artifactPath, {append: true});
    });

    it('should append to an existing log file starting with ,', async () => {
      mockArtifactFileAlreadyExists();

      const pid = 'testPid';
      const mockTracesResult = 'mockTracesResult';
      const artifactPath = 'detox_pid_testPid.trace.json';

      const tracingPlugin = new TracingPlugin({...configMock, pid});
      traceMock.traces.mockReturnValue(mockTracesResult);

      await tracingPlugin.onBeforeCleanup();

      expect(traceMock.traces).toHaveBeenCalledWith({prefix: ','});
      expect(fileArtifactMock.ctor).toHaveBeenCalledWith({temporaryData: mockTracesResult});
      expect(fileArtifactMock.save).toHaveBeenCalledWith(artifactPath, {append: true});
    });
  });
});
