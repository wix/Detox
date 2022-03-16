const InstrumentsArtifactPlugin = require('../artifacts/instruments/InstrumentsArtifactPlugin');
const LogArtifactPlugin = require('../artifacts/log/LogArtifactPlugin');
const ScreenshotArtifactPlugin = require('../artifacts/screenshot/ScreenshotArtifactPlugin');
const TimelineArtifactPlugin = require('../artifacts/timeline/TimelineArtifactPlugin');
const IosUIHierarchyPlugin = require('../artifacts/uiHierarchy/IosUIHierarchyPlugin');
const VideoArtifactPlugin = require('../artifacts/video/VideoArtifactPlugin');

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

const appWithNoBinary = {
  type: 'ios.app',
  bundleId: 'com.detox.example',
};

const appWithRelativeBinaryPath = {
  type: 'ios.app',
  binaryPath: 'ios/build/Build/Products/Release-iphonesimulator/example.app',
};

const appWithAbsoluteBinaryPath = {
  type: 'ios.app',
  binaryPath: process.platform === 'win32' ? 'C:\\Temp\\abcdef\\123' : '/tmp/abcdef/123',
};

const appWithBinaryAndBundleId = {
  type: 'ios.app',
  binaryPath: 'ios/build/Build/Products/Release-iphonesimulator/example.app',
  bundleId: 'com.detox.example',
};

const apkWithBinary = {
  type: 'android.apk',
  binaryPath: 'android/app/build/outputs/apk/release/app-release.apk',
  testBinaryPath: 'android/app/build/outputs/apk/release/app-release-androidTest.apk',
};

const iosSimulatorWithShorthandQuery = {
  type: 'ios.simulator',
  device: 'iPhone 7 Plus, iOS 10.2'
};

const iosSimulatorWithDetailedQuery = {
  type: 'ios.simulator',
  device: {
    type: 'iPhone 7 Plus',
    os: 'iOS 10.2',
  },
};

const validSession = {
  server: 'ws://localhost:8099',
  sessionId: 'test',
  debugSynchronization: 10000,
};

const androidEmulator = {
  'type': 'android.emulator',
  'device': {
    'avdName': 'Pixel_API_28',
  },
};

const androidEmulatorWithShorthandQuery = {
  'type': 'android.emulator',
  'device': 'Pixel_API_28',
};

module.exports = {
  allArtifactsConfiguration,
  defaultArtifactsConfiguration,
  pluginsAllResolved,
  pluginsDefaultsResolved,
  pluginsFailingResolved,

  validSession,

  appWithNoBinary,
  appWithRelativeBinaryPath,
  appWithAbsoluteBinaryPath,
  appWithBinaryAndBundleId,
  apkWithBinary,

  iosSimulatorWithShorthandQuery,
  iosSimulatorWithDetailedQuery,
  androidEmulator,
  androidEmulatorWithShorthandQuery,
};
