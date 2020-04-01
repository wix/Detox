describe('AVD validator', () => {
  let mockAvdsResolver;

  class MockAVDsResolver {
    constructor(...args) {
      mockAvdsResolver.ctor(...args);
      this.resolve = mockAvdsResolver.resolve;
    }
  }

  const emulatorExec = {};
  let uut;
  beforeEach(() => {
    mockAvdsResolver = {
      ctor: jest.fn(),
      resolve: jest.fn().mockResolvedValue(['mock-avd-name']),
    };
    jest.mock('./AVDsResolver', () => MockAVDsResolver);

    const AVDValidator = require('./AVDValidator');
    uut = new AVDValidator(emulatorExec);
  });

  it('should use an AVDs resolver', async () => {
    await uut.validate('mock-avd-name');

    expect(mockAvdsResolver.ctor).toHaveBeenCalledWith(emulatorExec);
    expect(mockAvdsResolver.resolve).toHaveBeenCalledWith('mock-avd-name');
  });

  it('should return safely if AVD exists', async () => {
    mockAvdsResolver.resolve.mockResolvedValue(['mock-avd-name']);
    await uut.validate('mock-avd-name');
  });

  it('should throw if no AVDs found', async () => {
    mockAvdsResolver.resolve.mockResolvedValue(undefined);

    try {
      await uut.validate();
      fail('expected to throw');
    } catch (err) {}
  });

  it('should throw if specific AVD not found', async () => {
    mockAvdsResolver.resolve.mockResolvedValue(['other-avd', 'yet-another']);

    try {
      await uut.validate();
      fail('expected to throw');
    } catch (err) {}
  });
});
