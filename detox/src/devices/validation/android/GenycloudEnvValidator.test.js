// @ts-nocheck
describe('Genymotion-cloud test environment validator', () => {

  const MOCK_GMSAAS_PATH = '/path/to/gmsaas';

  let exec;
  let uut;
  beforeEach(() => {
    jest.mock('../../../utils/environment');

    const environment = require('../../../utils/environment');
    environment.getGmsaasPath.mockReturnValue(MOCK_GMSAAS_PATH);

    const GenyExec = jest.genMockFromModule('../../allocation/drivers/android/genycloud/exec/GenyCloudExec');
    exec = new GenyExec();

    const GenycloudEnvValidator = require('./GenycloudEnvValidator');
    uut = new GenycloudEnvValidator({ exec });
  });

  const givenGmsaasVersion = (version) => exec.getVersion.mockResolvedValue({ version });
  const givenMinimalGmsaasVersion = () => givenGmsaasVersion('1.6.0');
  const givenFirstGmsaasVersionWithDoctor = () => givenGmsaasVersion('1.11.0');
  const givenLastGmsaasVersionWithoutDoctor = () => givenGmsaasVersion('1.10.0');
  const givenValidDoctorCheck = () => exec.doctor.mockResolvedValue({ exit_code: 0 });
  const givenFailedDoctorChecks = () => exec.doctor.mockRejectedValue(new Error(
    'Error: gmsaas is not configured properly' +
      '\nOne or several issues have been detected:' +
      '\n- Android SDK not configured.'));

  describe('version validations', () => {
    beforeEach(() => {
      givenValidDoctorCheck();
    });

    it('should throw an error if gmsaas exec is too old (minor version < 6)', async () => {
      givenGmsaasVersion('1.5.9');

      try {
        await uut.validate();
      } catch (e) {
        expect(e.constructor.name).toEqual('DetoxRuntimeError');
        expect(e).toMatchSnapshot();
        return;
      }
      throw new Error('Expected an error');
    });

    it('should accept the gmsaas exec if version is sufficiently new', async () => {
      givenMinimalGmsaasVersion();
      await uut.validate();
    });

    it('should accept the gmsaas exec if version is more than sufficiently new', async () => {
      givenGmsaasVersion('1.7.2');
      await uut.validate();
    });

    it('should throw an error if gmsaas exec is too old (major version < 1)', async () => {
      givenGmsaasVersion('0.6.0');

      await expect(uut.validate())
        .rejects
        .toThrowError(`Your Genymotion-Cloud executable (found in ${MOCK_GMSAAS_PATH}) is too old! (version 0.6.0)`);
    });
  });

  describe('health validations', () => {
    it('should throw if gmsaas doctor detects an error', async () => {
      givenFirstGmsaasVersionWithDoctor();
      givenFailedDoctorChecks();

      await expect(uut.validate()).rejects.toMatchSnapshot();
    });

    it('should pass if gmsaas doctor checks pass', async () => {
      givenFirstGmsaasVersionWithDoctor();
      givenValidDoctorCheck();

      await uut.validate();
    });

    it('should not run doctor checks if gmsaas version is too old', async () => {
      givenLastGmsaasVersionWithoutDoctor();
      givenFailedDoctorChecks();

      await uut.validate();
    });
  });
});
