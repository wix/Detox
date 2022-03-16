const aaptMockResults = require('./__mocks__/aapt-results');

describe('AAPT', () => {
  const mockAPKPath = 'path/to/app.apk';
  const mockAAPTPath = 'mockSdk/build-tools/30.0.0/aapt';
  const mockEscapeFunc = (source) => `escaped(${source})`;

  const givenAAPTResult = (result) => {
    exec.mockResolvedValue({
      stdout: result,
    });
  };
  const execCommand = () => exec.mock.calls[0][0];

  let environment;
  let escape;
  let exec;
  let aapt;
  beforeEach(() => {
    jest.mock('../../../../../utils/environment');
    environment = require('../../../../../utils/environment');
    environment.getAaptPath.mockResolvedValue(mockAAPTPath);

    jest.mock('../../../../../utils/childProcess');
    exec = require('../../../../../utils/childProcess').execWithRetriesAndLogs;
    givenAAPTResult('');

    jest.mock('../../../../../utils/pipeCommands');
    escape = require('../../../../../utils/pipeCommands').escape.inQuotedString;
    escape.mockImplementation(mockEscapeFunc);

    const AAPT = require('./AAPT');
    aapt = new AAPT();
  });

  describe('Reading package name', () => {
    it('should execute the AAPT command with proper args', async () => {
      await aapt.getPackageName(mockAPKPath);
      expect(execCommand()).toMatchSnapshot();
    });

    it('should execute the command with retries', async () => {
      await aapt.getPackageName(mockAPKPath);
      expect(exec).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ retries: 1 }));
    });

    it('should extract the package name', async () => {
      givenAAPTResult(aaptMockResults.dumpBadging);

      const pacakageName = await aapt.getPackageName('path/to/file.apk');
      expect(pacakageName).toEqual('com.wix.detox.test');
    });

    it(`should configure aaptBin only once`, async () => {
      givenAAPTResult(aaptMockResults.dumpBadging);

      await aapt.getPackageName('path/to/file.apk');
      await aapt.getPackageName('path/to/file.apk');

      expect(environment.getAaptPath).toHaveBeenCalledTimes(1);
    });
  });

  describe('Checking whether APK holds instrumentation testing', () => {
    it('should execute the AAPT command with proper args', async () => {
      await aapt.isTestAPK(mockAPKPath);
      expect(execCommand()).toMatchSnapshot();
    });

    it('should execute the command with retries', async () => {
      await aapt.isTestAPK(mockAPKPath);
      expect(exec).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ retries: 1 }));
    });

    it('should execute the command in non-verbose mode', async () => {
      await aapt.isTestAPK(mockAPKPath);
      expect(exec).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ verbosity: 'low' }));
    });

    it('should return true for a test APK', async () => {
      givenAAPTResult(aaptMockResults.dumpXmlStrings.testApk);

      const result = await aapt.isTestAPK(mockAPKPath);
      expect(result).toEqual(true);
    });

    it('should return false for a non-test APK', async () => {
      givenAAPTResult(aaptMockResults.dumpXmlStrings.prodApk);

      const result = await aapt.isTestAPK(mockAPKPath);
      expect(result).toEqual(false);
    });
  });
});
