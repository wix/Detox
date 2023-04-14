describe('AVD validator', () => {
  let logger;
  let environment;
  let avdsResolver;
  let versionResolver;
  let uut;
  beforeEach(() => {
    jest.mock('../../../../../utils/logger');
    logger = require('../../../../../utils/logger');

    jest.mock('../../../../../utils/environment');
    environment = require('../../../../../utils/environment');

    const AVDsResolver = jest.genMockFromModule('./AVDsResolver');
    avdsResolver = new AVDsResolver();

    const EmulatorVersionResolver = jest.genMockFromModule('./EmulatorVersionResolver');
    versionResolver = new EmulatorVersionResolver();
    versionResolver.resolve.mockResolvedValue('');

    const AVDValidator = require('./AVDValidator');
    uut = new AVDValidator(avdsResolver, versionResolver);
  });

  const givenExpectedAVD = () => avdsResolver.resolve.mockResolvedValue(['mock-avd-name']);
  const givenNoAVDs = () => avdsResolver.resolve.mockResolvedValue(undefined);
  const givenOtherAVDs = () => avdsResolver.resolve.mockResolvedValue(['other-avd', 'yet-another']);

  const givenOldEmulatorVersion = () => versionResolver.resolve.mockResolvedValue({
    major: 28,
    minor: 999,
    patch: 999,
    toString: () => '28.mock.ver',
  });
  const givenProperEmulatorVersion = () => versionResolver.resolve.mockResolvedValue({
    major: 29,
    minor: 0,
    patch: 0,
    toString: () => '29.x.y',
  });
  const givenUnknownEmulatorVersion = () => versionResolver.resolve.mockResolvedValue(null);

  const givenMockedAvdManagerPath = () => environment.getAvdManagerPath.mockReturnValue('mock/path/avdmng');
  const givenMockedAndroidSdkPath = () => environment.getAndroidSdkManagerPath.mockReturnValue('mock/path/sdkmng');

  it('should return safely if AVD exists', async () => {
    givenExpectedAVD();
    await uut.validate('mock-avd-name');
  });

  it('should throw if no AVDs found', async () => {
    givenMockedAvdManagerPath();
    givenNoAVDs();

    try {
      await uut.validate();
      fail('expected to throw');
    } catch (err) {
      const DetoxRuntimeError = require('../../../../../errors/DetoxRuntimeError');
      expect(err).toBeInstanceOf(DetoxRuntimeError);
      expect(err.toString()).toEqual(expect.stringContaining('Could not find any configured Android Emulator.'));
      expect(err.toString()).toEqual(expect.stringContaining('mock/path/avdmng create avd'));
    }
  });

  it('should throw if specific AVD not found', async () => {
    givenOtherAVDs();

    try {
      await uut.validate('mock-avd-name');
      fail('expected to throw');
    } catch (err) {
      const DetoxRuntimeError = require('../../../../../errors/DetoxRuntimeError');
      expect(err).toBeInstanceOf(DetoxRuntimeError);
      expect(err.toString()).toEqual(expect.stringContaining(`Cannot boot Android Emulator with the name: 'mock-avd-name'`));
      expect(err.toString()).toEqual(expect.stringContaining(`Make sure you choose one of the available emulators`));
    }
  });

  it('should warn about emulators that are too old', async () => {
    givenMockedAndroidSdkPath();
    givenExpectedAVD();
    givenOldEmulatorVersion();

    await uut.validate('mock-avd-name');

    expect(logger.warn).toHaveBeenCalledWith({ event: 'AVD_VALIDATION' }, [
      `Your installed emulator binary version (28.mock.ver) is too old, and may not be suitable for parallel test execution.`,
      'We strongly recommend you upgrade to the latest version using the SDK manager: mock/path/sdkmng --list'
    ].join('\n'));
    expect(versionResolver.resolve).toHaveBeenCalled();
  });

  it('should not warn about emulators that are sufficiently new', async () => {
    givenExpectedAVD();
    givenProperEmulatorVersion();

    await uut.validate('mock-avd-name');

    expect(logger.warn).not.toHaveBeenCalled();
  });

  it('should provide specific warning if emulator version detection failed', async () => {
    givenExpectedAVD();
    givenUnknownEmulatorVersion();

    await uut.validate('mock-avd-name');

    expect(logger.warn).toHaveBeenCalledWith(
      { event: 'AVD_VALIDATION' },
      'Emulator version detection failed (See previous logs)'
      );
  });

  it('should run emulator version resolver as headless if required', async () => {
    givenExpectedAVD();
    givenProperEmulatorVersion();

    await uut.validate('mock-avd-name', true);

    expect(versionResolver.resolve).toHaveBeenCalledWith(true);
  });
});
