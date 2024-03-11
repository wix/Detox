const GenyInstance = require('./services/dto/GenyInstance');

describe('Genymotion-Cloud instance launcher', () => {
  const recipeName = 'mock-recipe-name';

  const anInstance = (overrides) => new GenyInstance({
    uuid: 'mock-instance-uuid',
    name: 'mock-instance-name',
    adb_serial: '0.0.0.0',
    adb_serial_port: 0,
    state: 'OFFLINE',
    recipe: {
      name: recipeName,
    },
    ...overrides,
  });

  const anOfflineInstance = () => anInstance({ state: 'OFFLINE' });
  const anOnlineInstance = () => anInstance({ state: 'ONLINE' });
  const aDisconnectedInstance = anOnlineInstance;
  const aFullyConnectedInstance = () => anInstance({
    adb_serial: 'localhost:1234',
    adb_serial_port: 1234,
    state: 'ONLINE',
  });

  const givenInstanceGetResult = (instance) => genyCloudExec.getInstance.mockResolvedValue({ instance: instance.toJSON() });
  const givenInstanceCreateResult = (instance) => instanceLifecycleService.createInstance.mockResolvedValue(instance);
  const givenAnInstanceDeletionError = () => instanceLifecycleService.deleteInstance.mockRejectedValue(new Error());
  const givenInstanceConnectResult = (instance) => instanceLifecycleService.adbConnectInstance.mockResolvedValue(instance);

  let genyCloudExec;
  let instanceLifecycleService;
  let uut;
  let retry;

  beforeEach(() => {
    jest.mock('../../../../../utils/logger');

    jest.mock('../../../../../utils/retry');
    retry = jest.requireMock('../../../../../utils/retry');
    retry.mockImplementation((options, func) => func());

    const InstanceLifecycleService = jest.genMockFromModule('./services/GenyInstanceLifecycleService');
    instanceLifecycleService = new InstanceLifecycleService();

    const GenyCloudExec = jest.genMockFromModule('./exec/GenyCloudExec');
    genyCloudExec = new GenyCloudExec();

    const GenyInstanceLauncher = require('./GenyInstanceLauncher');
    uut = new GenyInstanceLauncher({
      genyCloudExec,
      instanceLifecycleService,
    });
  });

  describe('launch', () => {
    it('should create an unconnected instance', async () => {
      const recipe = {};
      const instance = anOnlineInstance();
      givenInstanceCreateResult(instance);
      givenInstanceConnectResult(instance);

      await expect(uut.launch(recipe, instance.name)).resolves.toEqual(instance);
    });
  });

  describe('connect', () => {
    it('should wait for the cloud instance to become online', async () => {
      const instance = anOfflineInstance();
      const instanceOnline = anOnlineInstance();
      givenInstanceGetResult(instanceOnline);
      givenInstanceConnectResult(instanceOnline);

      retry.mockImplementationOnce(async (options, func) => {
        const instance = await func();
        expect(genyCloudExec.getInstance).toHaveBeenCalledWith(instance.uuid);
        return instance;
      });

      const result = await uut.connect(instance);
      expect(result).toEqual(instanceOnline);
      expect(retry).toHaveBeenCalled();
    });

    it('should not wait for cloud instance to become online if already online', async () => {
      const instance = anOnlineInstance();
      givenInstanceCreateResult(instance);
      givenInstanceConnectResult(instance);

      const result = await uut.connect(instance);
      expect(genyCloudExec.getInstance).not.toHaveBeenCalled();
      expect(retry).not.toHaveBeenCalled();
      expect(result).toEqual(instance);
    });

    it('should fail if instance never becomes online', async () => {
      const instanceOffline = anOfflineInstance();
      givenInstanceGetResult(instanceOffline);
      givenInstanceConnectResult(instanceOffline);

      await expect(uut.connect(instanceOffline))
        .rejects
        .toThrowError(`Timeout waiting for instance ${instanceOffline.uuid} to be ready`);
    });

    it('should wait for the cloud instance to become online, with decent retry arguments', async () => {
      const expectedRetryArgs = {
        initialSleep: 45000,
        backoff: 'none',
        interval: 5000,
        retries: 20,
      };
      const instance = anOfflineInstance();
      const instanceOnline = anOnlineInstance();
      givenInstanceGetResult(instanceOnline);
      givenInstanceConnectResult(instanceOnline);

      await uut.connect(instance);
      expect(retry).toHaveBeenCalledWith(expect.objectContaining(expectedRetryArgs), expect.any(Function));
    });

    it('should adb-connect to instance if disconnected', async () => {
      const disconnectedInstance = aDisconnectedInstance();
      const connectedInstance = aFullyConnectedInstance();
      givenInstanceCreateResult(disconnectedInstance);
      givenInstanceConnectResult(connectedInstance);

      const result = await uut.connect(disconnectedInstance);
      expect(instanceLifecycleService.adbConnectInstance).toHaveBeenCalledWith(disconnectedInstance.uuid);
      expect(result).toEqual(connectedInstance);
    });

    it('should not connect a connected instance', async () => {
      const connectedInstance = aFullyConnectedInstance();
      givenInstanceCreateResult(connectedInstance);
      givenInstanceConnectResult(connectedInstance);

      await uut.connect(connectedInstance);

      expect(instanceLifecycleService.adbConnectInstance).not.toHaveBeenCalled();
    });
  });

  describe('Shutdown', () => {
    it('should delete the associated instance', async () => {
      const instance = anInstance();
      await uut.shutdown(instance.uuid);
      expect(instanceLifecycleService.deleteInstance).toHaveBeenCalledWith(instance.uuid);
    });

    it('should fail if deletion fails', async () => {
      givenAnInstanceDeletionError();

      const instance = anInstance();
      await expect(uut.shutdown(instance.uuid)).rejects.toThrowError();
    });

    it('should remove the instance from the cleanup registry', async () => {
      const instance = anInstance();
      await uut.shutdown(instance);
    });
  });
});
