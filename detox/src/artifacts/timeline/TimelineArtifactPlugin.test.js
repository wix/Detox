describe('TimelineArtifactPlugin', () => {
  const pid = 'mockPid';
  const processName = 'mockProcessName';
  const configMock = ({enabled = true, pid, processName} = {}) => ({
    api: {
      userConfig: {
        enabled,
      },
      preparePathForArtifact: async path => path,
    },
    timeline: {
      pid,
      processName,
    },
  });

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
  let TimelineArtifactPlugin;
  beforeEach(() => {
    jest.mock('fs-extra', () => ({
      access: jest.fn(),
    }));
    fs = require('fs-extra');

    TimelineArtifactPlugin = require('./TimelineArtifactPlugin');
  });

  describe('constructor', () => {
    it('should start trace process', () => {
      const config = configMock({pid, processName});
      new TimelineArtifactPlugin(config);
      expect(traceMock.startProcess).toHaveBeenCalledWith({id: pid, name: processName});
    });

    it('should not fail if no timeline config specified', () => {
      const config = configMock({pid, processName});
      delete config.timeline;

      new TimelineArtifactPlugin(config);
    });

    it('should not start trace process if disabled', () => {
      const config = configMock({enabled: false, pid, processName});
      new TimelineArtifactPlugin(config);
      expect(traceMock.startProcess).not.toHaveBeenCalled();
    })
  });

  describe('onBootDevice', () => {
    const deviceId = 'testDeviceId';
    const type = 'testDeviceType';

    it('should start trace thread', async () => {
      const config = configMock();

      const timelineArtifactPlugin = new TimelineArtifactPlugin(config);
      await timelineArtifactPlugin.onBootDevice({deviceId, type});

      expect(traceMock.startThread).toHaveBeenCalledWith({id: deviceId, name: type});
    });

    it('should not start thread if disabled', async () => {
      const config = configMock({enabled: false});

      const timelineArtifactPlugin = new TimelineArtifactPlugin(config);
      await timelineArtifactPlugin.onBootDevice({deviceId, type});

      expect(traceMock.startThread).not.toHaveBeenCalled();
    })
  });

  describe('onSuiteStart', () => {
    const deviceId = 'testDeviceId';
    const name = 'testSuiteName';

    it('should begin trace event', async () => {
      const config = configMock();

      const timelineArtifactPlugin = new TimelineArtifactPlugin(config);
      await timelineArtifactPlugin.onBootDevice({deviceId});
      await timelineArtifactPlugin.onSuiteStart({name});

      expect(traceMock.beginEvent).toHaveBeenCalledWith(name, {deviceId});
    });

    it('should not begin trace event if disabled', async () => {
      const config = configMock({enabled: false});

      const timelineArtifactPlugin = new TimelineArtifactPlugin(config);
      await timelineArtifactPlugin.onBootDevice({deviceId});
      await timelineArtifactPlugin.onSuiteStart({name});

      expect(traceMock.beginEvent).not.toHaveBeenCalled();
    });
  });

  describe('onSuiteEnd', () => {
    it('should finish trace event', async () => {
      const config = configMock();
      const name = 'testSuiteName';

      const timelineArtifactPlugin = new TimelineArtifactPlugin(config);
      await timelineArtifactPlugin.onSuiteEnd({name});

      expect(traceMock.finishEvent).toHaveBeenCalledWith(name);
    });
  });

  describe('onTestStart', () => {
    it('should begin trace event', async () => {
      const config = configMock();
      const title = 'testName';

      const timelineArtifactPlugin = new TimelineArtifactPlugin(config);
      await timelineArtifactPlugin.onTestStart({title});

      expect(traceMock.beginEvent).toHaveBeenCalledWith(title);
    });
  });

  describe('onTestDone', () => {
    it('should finish trace event', () => {
      const config = configMock();
      const title = 'testName';
      const status = 'testStatus';

      const timelineArtifactPlugin = new TimelineArtifactPlugin(config);
      timelineArtifactPlugin.onTestDone({title, status});

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

    it('should create artifact starting with [', async () => {
      mockArtifactFileNotExists();

      const config = configMock({pid});
      const expectedArtifactPath = `detox_pid_${pid}.trace.json`;

      const timelineArtifactPlugin = new TimelineArtifactPlugin(config);
      await timelineArtifactPlugin.onBeforeCleanup();

      expect(traceMock.traces).toHaveBeenCalledWith({prefix: '['});
      expect(fileArtifactMock.save).toHaveBeenCalledWith(expectedArtifactPath, {append: true});
    });

    it('should append to an existing artifact file starting with ,', async () => {
      mockArtifactFileAlreadyExists();

      const config = configMock({pid});
      const expectedArtifactPath = `detox_pid_${pid}.trace.json`;
      const mockTracesResult = 'mockTracesResult';

      const timelineArtifactPlugin = new TimelineArtifactPlugin(config);
      traceMock.traces.mockReturnValue(mockTracesResult);

      await timelineArtifactPlugin.onBeforeCleanup();

      expect(traceMock.traces).toHaveBeenCalledWith({prefix: ','});
      expect(fileArtifactMock.ctor).toHaveBeenCalledWith({temporaryData: mockTracesResult});
      expect(fileArtifactMock.save).toHaveBeenCalledWith(expectedArtifactPath, {append: true});
    });

    it('should not save artifact if disabled', async () => {
      mockArtifactFileNotExists();

      const config = configMock({enabled: false, pid});

      const timelineArtifactPlugin = new TimelineArtifactPlugin(config);
      await timelineArtifactPlugin.onBeforeCleanup();

      expect(traceMock.traces).not.toHaveBeenCalled();
      expect(fileArtifactMock.save).not.toHaveBeenCalled();
      expect(fs.access).not.toHaveBeenCalled();
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
