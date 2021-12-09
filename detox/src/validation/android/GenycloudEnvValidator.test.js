// @ts-nocheck
describe('Genymotion-cloud test environment validator', () => {

  const MOCK_GMSAAS_PATH = '/path/to/gmsaas';

  let exec;
  let authService;
  let uut;
  beforeEach(() => {
    jest.mock('../../utils/environment');

    const environment = require('../../utils/environment');
    environment.getGmsaasPath.mockReturnValue(MOCK_GMSAAS_PATH);

    const GenyExec = jest.genMockFromModule('../../devices/common/drivers/android/genycloud/exec/GenyCloudExec');
    exec = new GenyExec();

    const GenyAuthService = jest.genMockFromModule('../../devices/common/drivers/android/genycloud/services/GenyAuthService');
    authService = new GenyAuthService();

    const GenycloudEnvValidator = require('./GenycloudEnvValidator');
    uut = new GenycloudEnvValidator({ authService, exec });
  });

  const givenProperGmsaasLogin = () => authService.getLoginEmail.mockResolvedValue('detox@wix.com');
  const givenGmsaasLoggedOut = () => authService.getLoginEmail.mockResolvedValue(null);
  const givenGmsaasExecVersion = (version) => exec.getVersion.mockResolvedValue({ version });
  const givenProperGmsaasExecVersion = () => givenGmsaasExecVersion('1.6.0');

  it('should throw an error if gmsaas exec is too old (minor version < 6)', async () => {
    givenProperGmsaasLogin();
    givenGmsaasExecVersion('1.5.9');

    try {
      await uut.validate();
    } catch (e) {
      expect(e.constructor.name).toEqual('DetoxRuntimeError');
      expect(e.toString()).toContain(`Your Genymotion-Cloud executable (found in ${MOCK_GMSAAS_PATH}) is too old! (version 1.5.9)`);
      expect(e.toString()).toContain(`HINT: Detox requires version 1.6.0, or newer. To use 'android.genycloud' type devices, you must upgrade it, first.`);
      return;
    }
    throw new Error('Expected an error');
  });

  it('should accept the gmsaas exec if version is sufficiently new', async () => {
    givenProperGmsaasLogin();
    givenGmsaasExecVersion('1.6.0');
    await uut.validate();
  });

  it('should accept the gmsaas exec if version is more than sufficiently new', async () => {
    givenProperGmsaasLogin();
    givenGmsaasExecVersion('1.7.2');
    await uut.validate();
  });

  it('should throw an error if gmsaas exec is too old (major version < 1)', async () => {
    givenProperGmsaasLogin();
    givenGmsaasExecVersion('0.6.0');

    await expect(uut.validate())
      .rejects
      .toThrowError(`Your Genymotion-Cloud executable (found in ${MOCK_GMSAAS_PATH}) is too old! (version 0.6.0)`);
  });

  it('should throw an error if not logged-in to gmsaas', async () => {
    givenProperGmsaasExecVersion();
    givenGmsaasLoggedOut();

    try {
      await uut.validate();
    } catch (e) {
      expect(e.constructor.name).toEqual('DetoxRuntimeError');
      expect(e.toString()).toContain(`Cannot run tests using 'android.genycloud' type devices, because Genymotion was not logged-in to!`);
      expect(e.toString()).toContain(`HINT: Log-in to Genymotion-cloud by running this command (and following instructions):\n${MOCK_GMSAAS_PATH} auth login --help`);
      return;
    }
    throw new Error('Expected an error');
  });

  it('should not throw an error if properly logged in to gmsaas', async () => {
    givenProperGmsaasExecVersion();
    givenProperGmsaasLogin();
    await uut.validate();
  });
});
