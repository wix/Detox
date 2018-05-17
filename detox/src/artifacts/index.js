const _ = require('lodash');
const resolveByDeviceClass = require('./utils/resolveByDeviceClass');

const ADB = require('../devices/android/ADB');
const AppleSimUtils = require('../devices/AppleSimUtils');

const ADBLogcatLogger = require('./loggers/ADBLogcatLogger');
const AppleSimUtilsLogger = require('./loggers/AppleSimUtilsLogger');
const NoopLogger = require('./loggers/NoopLogger');

const AppleSimUtilsScreenshotter = require('./screenshotters/AppleSimUtilsScreenshotter');
const ADBScreenshotter = require('./screenshotters/ADBScreenshotter');
const NoopScreenshotter = require('./screenshotters/NoopScreenshotter');

const AppleSimUtilsVideoRecorder = require('./videoRecorders/AppleSimUtilsVideoRecorder');
const ADBVideoRecorder = require('./videoRecorders/ADBVideoRecorder');
const NonPausableVideoRecorder = require('./videoRecorders/NonPausableVideoRecorder');
const NoopVideoRecorder = require('./videoRecorders/NoopVideoRecorder');

const LoggerHooks = require('./hooks/LoggerHooks');
const ScreenshotterHooks = require('./hooks/ScreenshotterHooks');
const VideoRecorderHooks = require('./hooks/VideoRecorderHooks');

const NoConflictPathStrategy = require('./pathStrategies/NoConflictPathStrategy');
const ArtifactsManager = require('./ArtifactsManager');

const resolve = {
  adb: _.once(() => new ADB()),
  appleSimUtils: _.once(() => new AppleSimUtils()),
  artifacts: {
    pathStrategy: _.once((api) => new NoConflictPathStrategy({
      artifactsRootDir: api.getConfig().artifactsLocation,
    })),

    logger: {
      none: _.once(() => new NoopLogger()),
      ios: _.once(() => new AppleSimUtilsLogger({})),
      android: _.once(() => new ADBLogcatLogger({
        adb: resolve.adb(),
      })),
      default: _.once(resolveByDeviceClass({
        'ios.none': (api) => resolve.artifacts.logger.none(api),
        'ios.simulator': (api) => resolve.artifacts.logger.ios(api),
        'android.attached': (api) => resolve.artifacts.logger.android(api),
        'android.emulator': (api) => resolve.artifacts.logger.android(api),
      }, (deviceClass) => `Cannot record logs on an unsupported device class: ${deviceClass}`)),
    },

    screenshotter: {
      none: _.once(() => new NoopScreenshotter()),
      ios: _.once((api) => new AppleSimUtilsScreenshotter({
        appleSimUtils: resolve.appleSimUtils(api),
        udid: api.getDeviceId(),
      })),
      android: _.once((api) => new ADBScreenshotter({
        adb: resolve.adb(api),
        deviceId: api.getDeviceId(),
      })),
      default: _.once(resolveByDeviceClass({
        'ios.none': (api) => resolve.artifacts.screenshotter.none(api),
        'ios.simulator': (api) => resolve.artifacts.screenshotter.ios(api),
        'android.attached': (api) => resolve.artifacts.screenshotter.android(api),
        'android.emulator': (api) => resolve.artifacts.screenshotter.android(api),
      }, (deviceClass) => `Cannot take screenshots on an unsupported device class: ${deviceClass}`)),
    },

    videoRecorder: {
      none: _.once(() => new NoopVideoRecorder()),
      android: _.once((api) => new ADBVideoRecorder({
        adb: resolve.adb(),
        deviceId: api.getDeviceId(),
        screenRecordOptions: { verbose: true },
      })),
      ios: _.once((api) => new AppleSimUtilsVideoRecorder({
        appleSimUtils: resolve.appleSimUtils(api),
        udid: api.getDeviceId(),
      })),
      actual: _.once(resolveByDeviceClass({
        'ios.none': (api) => resolve.artifacts.videoRecorder.none(api),
        'ios.simulator': (api) => resolve.artifacts.videoRecorder.ios(api),
        'android.attached': (api) => resolve.artifacts.videoRecorder.android(api),
        'android.emulator': (api) => resolve.artifacts.videoRecorder.android(api),
      }, (deviceClass) => `Cannot record videos on an unsupported device class: ${deviceClass}`)),
      safe: _.once((detoxApi) => {
        const artifactsRootDir = detoxApi.getConfig().artifactsLocation;

        return new NonPausableVideoRecorder({
          artifactsRootDir,
          recorder: resolve.artifacts.videoRecorder.actual(detoxApi),
        });
      }),
      default: (api) => resolve.artifacts.videoRecorder.safe(api)
    },

    hooks: {
      log: _.once((api) => {
        const { recordLogs } = api.getConfig();

        return new LoggerHooks({
          enabled: recordLogs !== 'none',
          keepOnlyFailedTestLogs: recordLogs === 'failing',
          logger: resolve.artifacts.logger.default(api),
          pathStrategy: resolve.artifacts.pathStrategy(api),
        });
      }),

      screenshot: _.once((api) => {
        const { takeScreenshots } = api.getConfig();

        return new ScreenshotterHooks({
          enabled: takeScreenshots !== 'none',
          keepOnlyFailedTestScreenshots: takeScreenshots === 'failing',
          screenshotter: resolve.artifacts.screenshotter.default(api),
          pathStrategy: resolve.artifacts.pathStrategy(api),
        });
      }),

      video: _.once((api) => {
        const { recordVideos } = api.getConfig();

        return new VideoRecorderHooks({
          enabled: recordVideos !== 'none',
          keepOnlyFailedTestRecordings: recordVideos === 'failing',
          recorder: resolve.artifacts.videoRecorder.default(api),
          pathStrategy: resolve.artifacts.pathStrategy(api),
        });
      }),
    },

    artifactsManager: _.once((detoxApi) => {
      const manager = new ArtifactsManager({
        artifactsRootDir: detoxApi.getConfig().artifactsLocation,
      });

      return manager
        .registerHooks(resolve.artifacts.hooks.log(detoxApi))
        .registerHooks(resolve.artifacts.hooks.screenshot(detoxApi))
        .registerHooks(resolve.artifacts.hooks.video(detoxApi));
    }),
  },
};

module.exports = resolve.artifacts.artifactsManager;