const _ = require('lodash');

describe('Genymotion-Cloud instances lookup service', () => {
  let exec;
  let deviceRegistry;
  let instanceNaming;
  let uut;
  beforeEach(() => {
    const GenyCloudExec = jest.genMockFromModule('../exec/GenyCloudExec');
    exec = new GenyCloudExec();

    const GenyInstanceNaming = jest.genMockFromModule('./GenyInstanceNaming');
    instanceNaming = new GenyInstanceNaming();

    const DeviceRegistry = jest.genMockFromModule('../../../../../DeviceRegistry');
    deviceRegistry = new DeviceRegistry();

    const GenyInstancesLookupService = require('./GenyInstanceLookupService');
    uut = new GenyInstancesLookupService(exec, instanceNaming, deviceRegistry);
  });

  const anInstance = () => ({
    uuid: 'mock-instance-uuid',
    name: 'mock-instance-name',
    adb_serial: 'mock-serial:1111',
    state: 'ONLINE',
    recipe: {
      name: 'mock-recipe-name',
      uuid: 'mock-recipe-uuid',
    }
  });
  const anotherInstance = () => ({
    ...anInstance(),
    uuid: 'mock-instance-uuid2',
    name: 'mock-instance-name2',
  });
  const anInstanceOfOtherRecipe = () => ({
    ...anInstance(),
    recipe: {
      name: 'other-mock-recipe-name',
    },
  });

  function givenRegisteredInstances(...instances) {
    const instanceUUIDs = _.map(instances, 'uuid');
    deviceRegistry.getRegisteredDevices.mockReturnValue({
      includes: instanceUUIDs.includes.bind(instanceUUIDs),
    });
  }
  const givenNoRegisteredInstances = () => givenRegisteredInstances([]);
  const givenInstances = (...instances) => exec.getInstances.mockResolvedValue({ instances });
  const givenNoInstances = () => exec.getInstances.mockResolvedValue({ instances: [] });
  const givenAnInstance = (instance) => exec.getInstance.mockResolvedValue({ instance });
  const givenAllDevicesFamilial = () => instanceNaming.isFamilial.mockReturnValue(true);
  const givenNoDevicesFamilial = () => instanceNaming.isFamilial.mockReturnValue(false);

  describe('finding a free instance', () => {
    it('should return null if there are no cloud-instances available', async () => {
      givenNoInstances();
      givenNoRegisteredInstances();
      givenAllDevicesFamilial();
      expect(await uut.findFreeInstance('mock-recipe-uuid')).toEqual(null);
    });

    it('should return a free online instance', async () => {
      const instance = anInstance();
      givenInstances(instance);
      givenNoRegisteredInstances();
      givenAllDevicesFamilial();

      const result = await uut.findFreeInstance();
      expect(result.uuid).toEqual(instance.uuid);
      expect(result.constructor.name).toContain('Instance');
    });

    it('should not return an instance whose name isn\'t in the family', async () => {
      const instance = anInstance();
      givenInstances(instance);
      givenNoRegisteredInstances();
      givenNoDevicesFamilial();

      expect(await uut.findFreeInstance()).toEqual(null);
      expect(instanceNaming.isFamilial).toHaveBeenCalledWith(instance.name);
    });

    it('should not return an instance already taken by another worker', async () => {
      const instance = anInstance();
      givenInstances(instance);
      givenRegisteredInstances(instance);
      givenAllDevicesFamilial();

      expect(await uut.findFreeInstance()).toEqual(null);
    });

    it('should not return an offline instance', async () => {
      const instance = {
        ...anInstance(),
        state: 'OFFLINE',
      };
      givenInstances(instance);
      givenNoRegisteredInstances();
      givenAllDevicesFamilial();

      expect(await uut.findFreeInstance()).toEqual(null);
    });

    it('should return a free initializing instance', async () => {
      const instance = {
        ...anInstance(),
        state: 'BOOTING',
      };
      givenInstances(instance);
      givenNoRegisteredInstances();
      givenAllDevicesFamilial();

      const result = await uut.findFreeInstance();
      expect(result.uuid).toEqual(instance.uuid);
      expect(result.constructor.name).toContain('Instance');
    });

    it('should filter multiple matches of multiple instances', async () => {
      const instance = anInstance();
      givenInstances(anInstanceOfOtherRecipe(), instance, anotherInstance());
      givenNoRegisteredInstances();
      givenAllDevicesFamilial();

      const result = await uut.findFreeInstance();
      expect(result.uuid).toEqual(instance.uuid);
    });
  });

  describe('finding a specific instance', () => {
    it('should return an instance matching a UUID', async () => {
      const instance = anInstance();
      givenAnInstance(instance);

      const result = await uut.getInstance(instance.uuid);
      expect(result.uuid).toEqual(instance.uuid);
      expect(result.constructor.name).toContain('Instance');
      expect(exec.getInstance).toHaveBeenCalledWith(instance.uuid);
    });
  });
});
