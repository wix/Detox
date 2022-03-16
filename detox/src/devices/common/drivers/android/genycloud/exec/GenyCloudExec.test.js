
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

  [
    {
      commandName: 'version',
      commandExecFn: () => uut.getVersion(),
      expectedExec: `"mock/path/to/gmsaas" --format compactjson --version`,
    },
    {
      commandName: 'whoami',
      commandExecFn: () => uut.whoAmI(),
      expectedExec: `"mock/path/to/gmsaas" --format compactjson auth whoami`,
    },
    {
      commandName: 'Get Recipe',
      commandExecFn: () => uut.getRecipe(recipeName),
      expectedExec: `"mock/path/to/gmsaas" --format compactjson recipes list --name "${recipeName}"`,
    },
    {
      commandName: 'Get Instance',
      commandExecFn: () => uut.getInstance(instanceUUID),
      expectedExec: `"mock/path/to/gmsaas" --format compactjson instances get ${instanceUUID}`,
    },
    {
      commandName: 'Get Instances',
      commandExecFn: () => uut.getInstances(),
      expectedExec: `"mock/path/to/gmsaas" --format compactjson instances list -q`,
    },
    {
      commandName: 'Start Instance',
      commandExecFn: () => uut.startInstance(recipeUUID, instanceName),
      expectedExec: `"mock/path/to/gmsaas" --format compactjson instances start --stop-when-inactive --no-wait ${recipeUUID} "${instanceName}"`,
      expectedExecOptions: { retries: 0 },
    },
    {
      commandName: 'ADB Connect',
      commandExecFn: () => uut.adbConnect(instanceUUID),
      expectedExec: `"mock/path/to/gmsaas" --format compactjson instances adbconnect ${instanceUUID}`,
    },
    {
      commandName: 'Stop Instance',
      commandExecFn: () => uut.stopInstance(instanceUUID),
      expectedExec: `"mock/path/to/gmsaas" --format compactjson instances stop ${instanceUUID}`,
      expectedExecOptions: { retries: 3 },
    },
  ].forEach((testCase) => {
    describe(`${testCase.commandName} command`, () => {
      it('should execute command by name', async () => {
        givenSuccessResult();

        const expectedOptions = {
          ...testCase.expectedExecOptions,
          statusLogs: {
            retrying: true,
          }
        };

        await testCase.commandExecFn();
        expect(exec).toHaveBeenCalledWith(
          testCase.expectedExec,
          expectedOptions,
        );
      });

      it('should return the result', async () => {
        givenSuccessResult();

        const result = await testCase.commandExecFn();
        expect(result).toEqual(successResponse);
      });

      it('should fail upon an error result', async () => {
        givenErrorResult();

        await expect(testCase.commandExecFn()).rejects.toThrowError(JSON.stringify(failResponse));
      });
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
