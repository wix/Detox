const InstrumentsArtifactPlugin = require('../artifacts/instruments/InstrumentsArtifactPlugin');
const LogArtifactPlugin = require('../artifacts/log/LogArtifactPlugin');
const ScreenshotArtifactPlugin = require('../artifacts/screenshot/ScreenshotArtifactPlugin');
const VideoArtifactPlugin = require('../artifacts/video/VideoArtifactPlugin');
const TimelineArtifactPlugin = require('../artifacts/timeline/TimelineArtifactPlugin');
const IosUIHierarchyPlugin = require('../artifacts/uiHierarchy/IosUIHierarchyPlugin');

const defaultArtifactsConfiguration = {
  rootDir: 'artifacts',
  pathBuilder: null,
  plugins: {
    log: 'none',
    screenshot: 'manual',
    video: 'none',
    instruments: 'none',
    timeline: 'none',
    uiHierarchy: 'disabled',
  },
};

const allArtifactsConfiguration = {
  rootDir: 'artifacts',
  pathBuilder: null,
  plugins: {
    log: 'all',
    screenshot: 'all',
    video: 'all',
    instruments: 'all',
    timeline: 'all',
    uiHierarchy: 'enabled',
  },
};

const pluginsDefaultsResolved = {
  log: LogArtifactPlugin.parseConfig('none'),
  screenshot: ScreenshotArtifactPlugin.parseConfig('manual'),
  video: VideoArtifactPlugin.parseConfig('none'),
  instruments: InstrumentsArtifactPlugin.parseConfig('none'),
  timeline: TimelineArtifactPlugin.parseConfig('none'),
  uiHierarchy: IosUIHierarchyPlugin.parseConfig('disabled'),
};

const pluginsFailingResolved = {
  log: LogArtifactPlugin.parseConfig('failing'),
  screenshot: ScreenshotArtifactPlugin.parseConfig('failing'),
  video: VideoArtifactPlugin.parseConfig('failing'),
};

const pluginsAllResolved = {
  log: LogArtifactPlugin.parseConfig('all'),
  screenshot: ScreenshotArtifactPlugin.parseConfig('all'),
  video: VideoArtifactPlugin.parseConfig('all'),
  instruments: InstrumentsArtifactPlugin.parseConfig('all'),
  timeline: TimelineArtifactPlugin.parseConfig('all'),
  uiHierarchy: IosUIHierarchyPlugin.parseConfig('enabled'),
};

const invalidDeviceNoBinary = {
  "configurations": {
    "ios.sim.release": {
      "type": "ios.simulator",
      "name": "iPhone 7 Plus, iOS 10.2"
    }
  }
};

const validOneDeviceAndSession = {
  "session": {
    "server": "ws://localhost:8099",
    "sessionId": "test"
  },
  "configurations": {
    "ios.sim.release": {
      "binaryPath": "ios/build/Build/Products/Release-iphonesimulator/example.app",
      "testBinaryPath": "some/test/path",
      "type": "ios.simulator",
      "name": "iPhone 7 Plus, iOS 10.2"
    }
  }
};

const validOneAndroidDevice = {
  "configurations": {
    "android.emu.release": {
      "binaryPath": "android/app/build/outputs/apk/release/app-release.apk",
      "testBinaryPath": "android/app/build/outputs/apk/release/app-release-androidTest.apk",
      "utilBinaryPaths": ["android/util-app1.apk", "android/util-app2.apk"],
      "type": "android.emulator",
      "device": {
        "avdName": "Pixel_API_28",
      }
    }
  }
};

const pathsTests = {
  "session": {
    "server": "ws://localhost:8099",
    "sessionId": "test"
  },
  "configurations": {
    "absolutePath": {
      "binaryPath": process.platform === "win32" ? "C:\\Temp\\abcdef\\123" : "/tmp/abcdef/123",
      "type": "ios.simulator",
      "name": "iPhone 7 Plus, iOS 10.2"
    },
    "relativePath": {
      "binaryPath": "abcdef/123",
      "type": "ios.simulator",
      "name": "iPhone 7 Plus, iOS 10.2"
    }
  }
};

module.exports = {
  allArtifactsConfiguration,
  defaultArtifactsConfiguration,
  pluginsAllResolved,
  pluginsDefaultsResolved,
  pluginsFailingResolved,
  invalidDeviceNoBinary,
  validOneDeviceAndSession,
  validOneAndroidDevice,
  pathsTests,
};
