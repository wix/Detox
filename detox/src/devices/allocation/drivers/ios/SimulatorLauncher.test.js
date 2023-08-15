describe('Simulator launcher (helper)', () => {
  const udid = 'UD-1D';

  let applesimutils;
  let uut;
  beforeEach(() => {
    const AppleSimUtils = jest.genMockFromModule('../../../common/drivers/ios/tools/AppleSimUtils');
    applesimutils = new AppleSimUtils();

    const SimulatorLauncher = require('./SimulatorLauncher');
    uut = new SimulatorLauncher({ applesimutils });
  });

  describe('launch', () => {
    const type = 'mockType';
    const bootArgs = { mock: 'boot-args' };
    const headless = true;

    const givenBootResultCold = () => applesimutils.boot.mockResolvedValue(true);
    const givenBootResultWarm = () => applesimutils.boot.mockResolvedValue(false);

    it('should boot using apple-sim-utils', async () => {
      await uut.launch(udid, '', bootArgs, headless);
      expect(applesimutils.boot).toHaveBeenCalledWith(udid, bootArgs, headless);
    });

    it('should fail if apple-sim-utils fails', async () => {
      const error = new Error('mock error');
      applesimutils.boot.mockRejectedValue(error);
      await expect(uut.launch(udid, '', bootArgs)).rejects.toThrowError(error);
    });

    it('should emit boot event', async () => {
      givenBootResultWarm();
      await uut.launch(udid, type, {}, headless);
      expect(applesimutils.boot).toHaveBeenCalled();
    });

    it('should emit cold-boot status in boot event', async () => {
      givenBootResultCold();
      await uut.launch(udid, type, {}, headless);
      expect(applesimutils.boot).toHaveBeenCalled();
    });
  });

  describe('shutdown', () => {
    it('should shut down using apple-sim-utils', async () => {
      await uut.shutdown(udid);
      expect(applesimutils.shutdown).toHaveBeenCalledWith(udid);
    });

    it('should fail if apple-sim-utils fails', async () => {
      const error = new Error('mock error');
      applesimutils.shutdown.mockRejectedValue(error);
      await expect(uut.shutdown(udid)).rejects.toThrowError(error);
    });
  });
});
