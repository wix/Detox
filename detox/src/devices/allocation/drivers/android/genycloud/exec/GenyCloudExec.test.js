
const aResponse = (exit_code = 0, exit_code_desc = 'NO_ERROR') => ({
  exit_code,
  exit_code_desc,
});
const anErrorResponse = (exit_code, exit_code_desc, error_desc) => ({
  ...aResponse(exit_code, exit_code_desc),
  error: {
    message: `API return unexpected code: ${exit_code}. Error: {"code":"${error_desc}","message":"Oh no, mocked error has occurred!"}`,
    details: '',
  }
});

describe('Genymotion-cloud executable', () => {
  const successResponse = aResponse();
  const failResponse = anErrorResponse(4, 'API_ERROR', 'TOO_MANY_RUNNING_VDS');
  const recipeName = 'mock-recipe-name';
  const recipeUUID = 'mock-recipe-uuid';
  const instanceUUID = 'mock-uuid';
  const instanceName = 'detox-instance1';

  const givenSuccessResult = () => exec.mockResolvedValue({
    stdout: JSON.stringify(successResponse),
  });
  const givenErrorResult = () => exec.mockRejectedValue({
    stderr: JSON.stringify(failResponse),
  });

  let exec;
  let uut;
  beforeEach(() => {
    jest.mock('../../../../../../utils/childProcess');
    exec = require('../../../../../../utils/childProcess').execWithRetriesAndLogs;

    const GenyCloudExec = require('./GenyCloudExec');
    uut = new GenyCloudExec('mock/path/to/gmsaas');
  });

  afterEach(() => {
    delete process.env.GMSAAS_USER_AGENT_EXTRA_DATA;
  });

  describe.each([
    ['version', () => uut.getVersion(), `"mock/path/to/gmsaas" --format compactjson --version`],
    ['Get Recipe', () => uut.getRecipe(recipeName), `"mock/path/to/gmsaas" --format compactjson recipes list --name "${recipeName}"`],
    ['Get Instance', () => uut.getInstance(instanceUUID), `"mock/path/to/gmsaas" --format compactjson instances get ${instanceUUID}`],
    ['Get Instances', () => uut.getInstances(), `"mock/path/to/gmsaas" --format compactjson instances list -q`],
    ['Start Instance', () => uut.startInstance(recipeUUID, instanceName), `"mock/path/to/gmsaas" --format compactjson instances start --no-wait ${recipeUUID} "${instanceName}"`, { retries: 0 }],
    ['ADB Connect', () => uut.adbConnect(instanceUUID), `"mock/path/to/gmsaas" --format compactjson instances adbconnect ${instanceUUID}`],
    ['Stop Instance', () => uut.stopInstance(instanceUUID), `"mock/path/to/gmsaas" --format compactjson instances stop ${instanceUUID}`, { retries: 3 }],
])(`%s command`, (commandName, commandExecFn, expectedExec, expectedExecOptions) => {
    it('should execute command by name', async () => {
      givenSuccessResult();

      const expectedOptions = {
        ...expectedExecOptions,
        statusLogs: {
          retrying: true,
        }
      };

      await commandExecFn();
      expect(exec).toHaveBeenCalledWith(
        expectedExec,
        expectedOptions,
      );
    });

    it('should return the result', async () => {
      givenSuccessResult();

      const result = await commandExecFn();
      expect(result).toEqual(successResponse);
    });

    it('should fail upon an error result', async () => {
      givenErrorResult();

      await expect(commandExecFn()).rejects.toThrowError(JSON.stringify(failResponse));
    });
  });

  describe('User-agent bundling into gmsaas requests', () => {
    it('should set up \'detox\' as the default user-agent', () => {
      delete process.env.GMSAAS_USER_AGENT_EXTRA_DATA;

      const GenyCloudExec = require('./GenyCloudExec');
      new GenyCloudExec('mock/path/to/gmsaas');

      expect(process.env.GMSAAS_USER_AGENT_EXTRA_DATA).toEqual('detox');
    });

    it('should retain any value prespecified for user-agent', () => {
      delete process.env.GMSAAS_USER_AGENT_EXTRA_DATA;
      process.env.GMSAAS_USER_AGENT_EXTRA_DATA = 'mockUserAgent';

      const GenyCloudExec = require('./GenyCloudExec');
      new GenyCloudExec('mock/path/to/gmsaas');

      expect(process.env.GMSAAS_USER_AGENT_EXTRA_DATA).toEqual('mockUserAgent');
    });
  });
});
