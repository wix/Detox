describe('AVD validator', () => {
  const emulatorExec = {};

  let AVDsResolverClass;
  let uut;
  beforeEach(() => {
    jest.mock('./AVDsResolver');
    AVDsResolverClass = require('./AVDsResolver');

    const AVDValidator = require('./AVDValidator');
    uut = new AVDValidator(emulatorExec);
  });

  const avdsResolverObj = () => AVDsResolverClass.mock.instances[0];

  it('should use an AVDs resolver', async () => {
    avdsResolverObj().resolve.mockResolvedValue(['mock-avd-name']);

    await uut.validate('mock-avd-name');

    expect(AVDsResolverClass).toHaveBeenCalledWith(emulatorExec);
    expect(AVDsResolverClass.mock.instances[0].resolve).toHaveBeenCalledWith('mock-avd-name');
  });

  it('should return safely if AVD exists', async () => {
    avdsResolverObj().resolve.mockResolvedValue(['mock-avd-name']);
    await uut.validate('mock-avd-name');
  });

  it('should throw if no AVDs found', async () => {
    avdsResolverObj().resolve.mockResolvedValue(undefined);

    try {
      await uut.validate();
      fail('expected to throw');
    } catch (err) {}
  });

  it('should throw if specific AVD not found', async () => {
    avdsResolverObj().resolve.mockResolvedValue(['other-avd', 'yet-another']);

    try {
      await uut.validate();
      fail('expected to throw');
    } catch (err) {}
  });
});
