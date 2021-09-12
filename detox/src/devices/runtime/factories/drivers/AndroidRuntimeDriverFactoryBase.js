const RuntimeDriverFactoryBase = require('./RuntimeDriverFactoryBase');

class AndroidRuntimeDriverFactoryBase extends RuntimeDriverFactoryBase {
  _createDependencies(commonDeps) {
    const serviceLocator = require('../../../../servicelocator/android');
    const adb = serviceLocator.adb();
    const aapt = serviceLocator.aapt();
    const fileXfer = serviceLocator.fileXfer();
    const devicePathBuilder = serviceLocator.devicePathBuilder();

    const AppInstallHelper = require('../../../common/drivers/android/tools/AppInstallHelper');
    const AppUninstallHelper = require('../../../common/drivers/android/tools/AppUninstallHelper');
    const MonitoredInstrumentation = require('../../../common/drivers/android/tools/MonitoredInstrumentation');

    return {
      ...commonDeps,
      adb,
      aapt,
      fileXfer,
      devicePathBuilder,
      appInstallHelper: new AppInstallHelper(adb, fileXfer),
      appUninstallHelper: new AppUninstallHelper(adb),
      instrumentation: new MonitoredInstrumentation(adb),
    }
  }
}

module.exports = AndroidRuntimeDriverFactoryBase;
