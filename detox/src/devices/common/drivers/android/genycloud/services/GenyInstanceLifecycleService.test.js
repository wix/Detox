describe('Genymotion-Cloud instance-lifecycle service', () => {
  const anInstance = () => ({
    uuid: 'mock-instance-uuid',
    name: 'mock-instance-name',
    adb_serial: 'mock-serial:1111',
    recipe: {
      name: 'mock-recipe-name',
    }
  });

  let exec;
  let instanceNaming;
  let uut;
  beforeEach(() => {
    const GenyCloudExec = jest.genMockFromModule('../exec/GenyCloudExec');
    exec = new GenyCloudExec();

    const GenyInstanceNaming = jest.genMockFromModule('./GenyInstanceNaming');
    instanceNaming = new GenyInstanceNaming();

    const GenyInstanceLifecycleService = require('./GenyInstanceLifecycleService');
    uut = new GenyInstanceLifecycleService(exec, instanceNaming);
  });

  describe('device instance creation', () => {
    const givenInstanceBirthName = (name) => instanceNaming.generateName.mockReturnValue(name);
    const givenResultedInstance = (instance) => exec.startInstance.mockResolvedValue({ instance });

    it('should exec instance creation according to recipe', async () => {
      const instance = anInstance();
      givenInstanceBirthName(instance.name);
      givenResultedInstance(instance);

      await uut.createInstance(instance.recipe.uuid);
      expect(exec.startInstance).toHaveBeenCalledWith(instance.recipe.uuid, instance.name);
    });

    it('should return the newly created instance', async () => {
      const instance = anInstance();
      givenInstanceBirthName(instance.name);
      givenResultedInstance(instance);

      const result = await uut.createInstance(instance.recipe.name);
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
});
