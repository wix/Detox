describe('Genymotion-cloud driver', () => {
  const anInstance = () => ({
    uuid: 'mock-instance-uuid',
    name: 'mock-instance-name',
    adbName: 'mock-instance-adb-name',
    toString: () => 'mock-instance-toString()',
  });

  let aapt;
  let eventEmitter;
  let invocationManager;
  let appInstallHelper;
  let apkValidator;
  let instrumentation;
  let detoxGenymotionManager;

  beforeEach(() => {
    jest.mock('../../../../common/drivers/android/exec/AAPT');
    const AAPT = require('../../../../common/drivers/android/exec/AAPT');
    aapt = new AAPT();
    aapt.isTestAPK
      .mockResolvedValueOnce(false)
      .mockResolvedValueOnce(true);

    jest.mock('../../../../../utils/getAbsoluteBinaryPath');

    const Emitter = jest.genMockFromModule('../../../../../utils/AsyncEmitter');
    eventEmitter = new Emitter();

    const { InvocationManager } = jest.genMockFromModule('../../../../../invoke');
    invocationManager = new InvocationManager();

    jest.mock('../../../../common/drivers/android/tools/AppUninstallHelper');

    jest.mock('../../../../common/drivers/android/tools/AppInstallHelper');
    const AppInstallHelper = require('../../../../common/drivers/android/tools/AppInstallHelper');
    appInstallHelper = new AppInstallHelper();

    jest.mock('../../../../common/drivers/android/tools/ApkValidator');
    const ApkValidator = require('../../../../common/drivers/android/tools/ApkValidator');
    apkValidator = new ApkValidator();

    jest.mock('../../../../common/drivers/android/tools/MonitoredInstrumentation');
    const Instrumentation = require('../../../../common/drivers/android/tools/MonitoredInstrumentation');
    instrumentation = new Instrumentation();

    jest.mock('../../../../../android/espressoapi/DetoxGenymotionManager');
    detoxGenymotionManager = require('../../../../../android/espressoapi/DetoxGenymotionManager');
  });

  describe('instance scope', () => {
    let instance;
    let GenyCloudDriver;
    let uut;
    beforeEach(() => {
      instance = anInstance();
      GenyCloudDriver = require('./GenyCloudDriver');
      uut = new GenyCloudDriver({
        aapt,
        apkValidator,
        invocationManager,
        eventEmitter,
        client: {},
        appInstallHelper,
        instrumentation,
      }, { instance });
    });

    it('should return the adb-name as the external ID', () => {
      expect(uut.getExternalId()).toEqual(instance.adbName);
    });

    it('should return the instance description as the external ID', () => {
      expect(uut.getDeviceName()).toEqual(instance.toString());
    });

    describe('app installation', () => {
      let getAbsoluteBinaryPath;
      beforeEach(() => {
        getAbsoluteBinaryPath = require('../../../../../utils/getAbsoluteBinaryPath');
      });

      it('should install using install helper', async () => {
        getAbsoluteBinaryPath
          .mockReturnValueOnce('bin-install-path')
          .mockReturnValueOnce('testbin-install-path');

        await uut.installApp('bin-path', 'testbin-path');
        expect(appInstallHelper.install).toHaveBeenCalledWith(instance.adbName, 'bin-install-path', 'testbin-install-path');
      });
    });

    describe('clean-up', () => {
      it('should kill instrumentation', async () => {
        await uut.cleanup('bundle-id');
        expect(instrumentation.terminate).toHaveBeenCalled();
      });
    });

    describe('setLocation', () => {
      it('should invoke `DetoxGenymotionManager.setLocation` with specified coordinates', async () => {
        const invocation = {
          method: 'setLocation'
        };
        detoxGenymotionManager.setLocation.mockReturnValue(invocation);

        await uut.setLocation('40.5', '55.5');
        expect(invocationManager.execute).toHaveBeenCalledWith(invocation);
        expect(detoxGenymotionManager.setLocation).toHaveBeenCalledWith(40.5, 55.5);
      });
    });
  });
});
