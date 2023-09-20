describe('iOS simulator test environment validator', () => {
  let environment;
  let uut;

  const givenFrameworkPathExists = () => environment.getFrameworkPath.mockResolvedValue(__dirname);
  const givenFrameworkPathNotExists = () => environment.getFrameworkPath.mockResolvedValue('/path/to/framework');

  beforeEach(() => {
    jest.mock('../../../utils/environment');
    environment = jest.requireMock('../../../utils/environment');

    const IosSimulatorEnvValidator = require('./IosSimulatorEnvValidator');
    uut = new IosSimulatorEnvValidator();
  });

  describe('given detox framework path doesn\'t exist', () => {
    it('should throw an error, with instruction to remedy', async () => {
      givenFrameworkPathNotExists();
      await expect(() => uut.validate()).rejects.toThrowError('/path/to/framework could not be found');
    });
  });

  describe('given detox framework path exists', () => {
    it('should not throw an error', async () => {
      givenFrameworkPathExists();
      await uut.validate();
    });
  });
});
