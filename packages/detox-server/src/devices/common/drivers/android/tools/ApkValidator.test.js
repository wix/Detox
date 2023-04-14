describe('APK validation', () => {

  const binaryPath = 'mock-bin-path';
  const testBinaryPath = 'mock-test-bin-path';

  let aapt;
  let uut;
  beforeEach(() => {
    const AAPT = jest.genMockFromModule('../exec/AAPT');
    aapt = new AAPT();

    const ApkValidator = require('./ApkValidator');
    uut = new ApkValidator(aapt);
  });

  const givenAAPTResult = (result) => aapt.isTestAPK.mockResolvedValue(result);
  const givenAAPTError = (error) => aapt.isTestAPK.mockRejectedValue(error);

  describe('App APK validation', () => {
    it('should validate the APK is not a test APK', async () => {
      givenAAPTResult(false);
      await uut.validateAppApk(binaryPath);
      expect(aapt.isTestAPK).toHaveBeenCalledWith(binaryPath);
    });

    it('should throw a descriptive error if app APK happens to be a test APK', async () => {
      givenAAPTResult(true);
      await expect(uut.validateAppApk(binaryPath)).rejects.toThrowErrorMatchingSnapshot();
    });

    it('should throw a specific error if AAPT throws', async () => {
      givenAAPTError(new Error('mock error'));
      await expect(uut.validateAppApk(binaryPath)).rejects.toThrowErrorMatchingSnapshot();
    });
  });

  describe('Test APK validation', () => {
    it('should validate the APK is indeed a test APK', async () => {
      givenAAPTResult(true);
      await uut.validateTestApk(testBinaryPath);
      expect(aapt.isTestAPK).toHaveBeenCalledWith(testBinaryPath);
    });

    it('should throw a descriptive error if APK happens to be an app APK', async () => {
      givenAAPTResult(false);
      await expect(uut.validateTestApk(testBinaryPath)).rejects.toThrowErrorMatchingSnapshot();
    });

    it('should throw a specific error if AAPT throws', async () => {
      givenAAPTError(new Error('mock error'));
      await expect(uut.validateTestApk(testBinaryPath)).rejects.toThrowErrorMatchingSnapshot();
    });
  });
});
