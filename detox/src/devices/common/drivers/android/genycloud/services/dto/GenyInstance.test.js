describe('Genymotion-Cloud Instance DTO', () => {
  const rawInstance = {
    uuid: 'mock-uuid',
    name: 'mock-name',
    state: undefined,
    recipe: {
      uuid: 'mock-recipe-uuid',
      name: 'mock-recipe-name',
    },
  };

  const disconnectedRawInstance = {
    ...rawInstance,
    state: 'ONLINE',
    adb_serial: '0.0.0.0',
    adb_serial_port: 0,
  };

  const connectedRawInstance = {
    ...rawInstance,
    state: 'ONLINE',
    adb_serial: 'localhost:7777',
    adb_serial_port: 7777,
  };

  const bootingInstance = {
    ...disconnectedRawInstance,
    state: 'BOOTING',
  };
  const startingInstance = {
    ...disconnectedRawInstance,
    state: 'STARTING',
  };
  const creatingInstance = {
    ...disconnectedRawInstance,
    state: 'CREATING',
  };
  const onlineInstance = disconnectedRawInstance;

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

  it('should indicate instance is online', () => {
    const instance = new Instance(onlineInstance);
    expect(instance.isOnline()).toEqual(true);
  });

  it('should indicate instance in not online-state', () => {
    const instance = new Instance(bootingInstance);
    expect(instance.isOnline()).toEqual(false);
  });

  it('should indicate an instance that is under creation is initializing', () => {
    const instance = new Instance(creatingInstance);
    expect(instance.isInitializing()).toEqual(true);
  });

  it('should indicate an online instance is not initializing', () => {
    const instance = new Instance(onlineInstance);
    expect(instance.isInitializing()).toEqual(false);
  });

  it('should indicate a booting instance is initializing', () => {
    const instance = new Instance(bootingInstance);
    expect(instance.isInitializing()).toEqual(true);
  });

  it('should indicate a starting-up instance is initializing', () => {
    const instance = new Instance(startingInstance);
    expect(instance.isInitializing()).toEqual(true);
  });

  it('should override toString()', () => {
    const instance = new Instance(connectedRawInstance);
    expect(`${instance}`).toEqual(`GenyCloud:${instance.name} (${instance.uuid} ${instance.adbName})`);
  });
});
