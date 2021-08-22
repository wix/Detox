const mockBaseClassesDependencies = () => {
  jest.mock('../../../../common/drivers/android/exec/ADB');
  jest.mock('../../../../common/drivers/android/exec/AAPT');
  jest.mock('../../../../common/drivers/android/tools/APKPath');
  jest.mock('../../../../common/drivers/android/tools/TempFileXfer');
  jest.mock('../../../../common/drivers/android/tools/AppInstallHelper');
  jest.mock('../../../../common/drivers/android/tools/AppUninstallHelper');
  jest.mock('../../../../common/drivers/android/tools/MonitoredInstrumentation');
  jest.mock('../../../../../artifacts/utils/AndroidDevicePathBuilder');
  jest.mock('../../../../../android/espressoapi/UiDeviceProxy');
  jest.mock('../../../../../utils/logger');
};

describe('Attached android device driver', () => {
  beforeEach(mockBaseClassesDependencies);

  const adbName = '9A291FFAZ005S9';

  let emitter;
  let uut;
  beforeEach(() => {
    const Emitter = jest.genMockFromModule('../../../../../utils/AsyncEmitter');
    emitter = new Emitter();

    const { InvocationManager } = jest.genMockFromModule('../../../../../invoke');
    const invocationManager = new InvocationManager();

    const AttachedAndroidDriver = require('./AttachedAndroidDriver');
    uut = new AttachedAndroidDriver(adbName, {
      invocationManager,
      emitter,
      client: {},
    });
  });

  it('should return the adb-name as the external ID', () => {
    expect(uut.getExternalId()).toEqual(adbName);
  });

  it('should return the instance description as the external ID', () => {
    expect(uut.getDeviceName()).toEqual(`AttachedDevice:${adbName}`);
  });
});
