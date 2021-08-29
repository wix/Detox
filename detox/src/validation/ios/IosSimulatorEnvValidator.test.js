describe('iOS simulator test environment validator', () => {

  const DETOX_FRAMEWORK_PATH = '/path/to/framework';

  const givenFrameworkPathExists = () => jest.spyOn(uut, '_frameworkPathExists').mockReturnValue(true);
  const givenFrameworkPathNotExists = () => jest.spyOn(uut, '_frameworkPathExists').mockReturnValue(false);

  let uut;
  beforeEach(() => {
    const IosSimulatorEnvValidator = require('./IosSimulatorEnvValidator');
    uut = new IosSimulatorEnvValidator(DETOX_FRAMEWORK_PATH);
  });

  describe('given detox framework path doesn\'t exist', () => {
    it('should throw an error, with instruction to remedy', async () => {
      givenFrameworkPathNotExists();
      expect(() => uut.validate()).toThrowError('/path/to/framework could not be found');
    });
  });

  describe('given detox framework path exists', () => {
    it('should not throw an error', async () => {
      givenFrameworkPathExists();
      uut.validate();
    });
  });
});
