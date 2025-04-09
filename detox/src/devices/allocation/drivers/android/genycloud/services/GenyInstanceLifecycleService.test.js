describe('Genymotion-Cloud instance-lifecycle service', () => {
  const anInstance = () => ({
    uuid: 'mock-instance-uuid',
    name: 'mock-instance-name',
    adb_serial: 'mock-serial:1111',
    recipe: {
      name: 'mock-recipe-name',
    }
  });

  const adbDevicesOutput = [
    'List of devices attached',
    'localhost:12345\tdevice',
  ].join('\n');

  let log;
  /** @type { jest.Mocked<*> } */
  let retry;
  let adb;
  let exec;
  let uut;

  beforeEach(() => {
    jest.mock('../../../../../../utils/logger');
    log = require('../../../../../../utils/logger');

    jest.mock('../../../../../../utils/retry'/*, () => (_options, func) => func()*/);
    retry = require('../../../../../../utils/retry');
    retry.mockImplementation((_options, func) => func());

    const ADB = jest.genMockFromModule('../../../../../common/drivers/android/exec/ADB');
    adb = new ADB();
    adb.devices.mockResolvedValue({
      stdout: adbDevicesOutput,
    });

    const GenyCloudExec = jest.genMockFromModule('../exec/GenyCloudExec');
    exec = new GenyCloudExec();

    const GenyInstanceLifecycleService = require('./GenyInstanceLifecycleService');
    uut = new GenyInstanceLifecycleService(exec, adb);
  });

  describe('device instance creation', () => {
    const givenResultedInstance = (instance) => exec.startInstance.mockResolvedValue({ instance });

    it('should exec instance creation according to recipe', async () => {
      const instance = anInstance();
      givenResultedInstance(instance);

      await uut.createInstance(instance.recipe.uuid, instance.name);
      expect(exec.startInstance).toHaveBeenCalledWith(instance.recipe.uuid, instance.name);
    });

    it('should return the newly created instance', async () => {
      const instance = anInstance();
      givenResultedInstance(instance);

      const result = await uut.createInstance(instance.recipe.name, instance.name);
      expect(result).toBeDefined();
      expect(result.uuid).toEqual(instance.uuid);
      expect(result.name).toEqual(instance.name);
      expect(result.recipeUUID).toEqual(instance.recipe.uuid);
      expect(result.constructor.name).toContain('Instance');
    });
  });

  describe('device adb-connect setup', () => {
    const givenAdbConnectResult = (instance) => exec.adbConnect.mockResolvedValue({ instance });

    it('should exec adb-connect', async () => {
      const instance = anInstance();
      givenAdbConnectResult(instance);

      await uut.adbConnectInstance(instance.uuid);
      expect(exec.adbConnect).toHaveBeenCalledWith(instance.uuid);
    });

    it('should return the updated instance', async () => {
      const instance = anInstance();
      givenAdbConnectResult(instance);

      const result = await uut.adbConnectInstance(instance.uuid);
      expect(result.uuid).toEqual(instance.uuid);
      expect(result.constructor.name).toContain('Instance');
    });

    it('should wrap the command with a retry', async () => {
      const instance = anInstance();
      givenAdbConnectResult(instance);
      givenRetryOnce();

      await uut.adbConnectInstance(instance.uuid);
      expect(retry).toHaveBeenCalledWith(expect.objectContaining({ retries: 2 }), expect.any(Function));
      expect(exec.adbConnect).toHaveBeenCalledTimes(2);
      expect(exec.adbConnect).toHaveBeenLastCalledWith(instance.uuid);
    });

    it('should log an adb-devices dump on retry', async () => {
      const instance = anInstance();
      givenAdbConnectResult(instance);
      givenRetryOnce();

      await uut.adbConnectInstance(instance.uuid);
      expect(log.warn).toHaveBeenCalledWith(expect.stringContaining('adb-connect command failed'), adbDevicesOutput);
    });

    it('should overcome failing adb-devices dumping attempts', async () => {
      const adbError = new Error('Yet another unexpected ADB adbError');
      const instance = anInstance();
      givenAdbConnectResult(instance);
      givenRetryOnce();
      adb.devices.mockRejectedValue(adbError);

      await uut.adbConnectInstance(instance.uuid);
      expect(log.warn).toHaveBeenCalledWith(expect.stringContaining('adb-connect command failed'), adbError);
    });
  });

  describe('device instance deletion', () => {
    const givenResult = (instance) => exec.stopInstance.mockResolvedValue({ instance });

    it('should exec instance deletion', async () => {
      const instance = anInstance();
      givenResult(instance);

      await uut.deleteInstance(instance.uuid);

      expect(exec.stopInstance).toHaveBeenCalledWith(instance.uuid);
    });

    it('should return result', async () => {
      const instance = anInstance();
      givenResult(instance);

      const result = await uut.deleteInstance(instance.uuid);
      expect(result.uuid).toEqual(instance.uuid);
      expect(result.constructor.name).toContain('Instance');
    });
  });

  function givenRetryOnce() {
    retry.mockImplementationOnce(async ({ conditionFn }, func) => {
      await func();
      await conditionFn();
      return await func();
    });
  }
});
