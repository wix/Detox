describe('Genymotion-Cloud Instance DTO', () => {
  const connectedRawInstance = {
    uuid: 'mock-uuid',
    name: 'mock-name',
    state: 'ONLINE',
    adb_serial: 'localhost:7777',
    adb_serial_port: 7777,
    recipe: {
      uuid: 'mock-recipe-uuid',
      name: 'mock-recipe-name',
    },
  };

  const disconnectedRawInstance = {
    ...connectedRawInstance,
    adb_serial: '0.0.0.0',
    adb_serial_port: 0,
  };

  const recycledRawInstance = {
    ...connectedRawInstance,
    state: 'RECYCLED',
  }

  const onlineInstance = disconnectedRawInstance;
  const bootingInstance = {
    ...onlineInstance,
    state: 'BOOTING',
  };

  let Instance;
  beforeEach(() => {
    Instance = require('./GenyInstance');
  });

  it('should have proper fields', () => {
    const rawInstance = connectedRawInstance;

    const instance = new Instance(rawInstance);

    expect(instance.uuid).toEqual('mock-uuid');
    expect(instance.name).toEqual('mock-name');
    expect(instance.adbName).toEqual(rawInstance.adb_serial);
    expect(instance.recipeName).toEqual('mock-recipe-name');
    expect(instance.recipeUUID).toEqual('mock-recipe-uuid');
    expect(instance.state).toEqual('ONLINE');
  });

  it('should indicate an ADB-connection', () => {
    const instance = new Instance(connectedRawInstance);
    expect(instance.isAdbConnected()).toEqual(true);
  });

  it('should indicate an ADB-disconnection', () => {
    const instance = new Instance(disconnectedRawInstance);
    expect(instance.isAdbConnected()).toEqual(false);
  });

  it('should indicate termination', () => {
    const instance = new Instance(recycledRawInstance);
    expect(instance.isTerminated()).toEqual(true);
  });

  it('should indicate non-termination', () => {
    const instance = new Instance(disconnectedRawInstance);
    expect(instance.isTerminated()).toEqual(false);
  });

  it('should indicate instance is online', () => {
    const instance = new Instance(onlineInstance);
    expect(instance.isOnline()).toEqual(true);
  });

  it('should indicate instance in not online-state', () => {
    const instance = new Instance(bootingInstance);
    expect(instance.isOnline()).toEqual(false);
  });
});
