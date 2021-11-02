describe('Attached android device driver', () => {
  const adbName = '9A291FFAZ005S9';

  let emitter;
  let uut;
  beforeEach(() => {
    jest.mock('../../../../../utils/logger');

    const Emitter = jest.genMockFromModule('../../../../../utils/AsyncEmitter');
    emitter = new Emitter();

    const { InvocationManager } = jest.genMockFromModule('../../../../../invoke');
    const invocationManager = new InvocationManager();

    const AttachedAndroidDriver = require('./AttachedAndroidDriver');
    uut = new AttachedAndroidDriver({
      invocationManager,
      emitter,
      client: {},
    }, { adbName });
  });

  it('should return the adb-name as the external ID', () => {
    expect(uut.getExternalId()).toEqual(adbName);
  });

  it('should return the instance description as the external ID', () => {
    expect(uut.getDeviceName()).toEqual(`AttachedDevice:${adbName}`);
  });
});
