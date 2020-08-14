const _ = require('lodash');
const resolveModuleFromPath = require('../utils/resolveModuleFromPath');
const buildDefaultArtifactsRootDirpath = require('../artifacts/utils/buildDefaultArtifactsRootDirpath');

const TimelineArtifactPlugin = require('../artifacts/timeline/TimelineArtifactPlugin');
const InstrumentsArtifactPlugin = require('../artifacts/instruments/InstrumentsArtifactPlugin');
const LogArtifactPlugin = require('../artifacts/log/LogArtifactPlugin');
const ScreenshotArtifactPlugin = require('../artifacts/screenshot/ScreenshotArtifactPlugin');
const VideoArtifactPlugin = require('../artifacts/video/VideoArtifactPlugin');
const IosUIHierarchyPlugin = require('../artifacts/uiHierarchy/IosUIHierarchyPlugin');
const ArtifactPathBuilder = require('../artifacts/utils/ArtifactPathBuilder');

function composeArtifactsConfig({
  cliConfig,
  configurationName,
  deviceConfig,
  detoxConfig,
}) {
  const artifactsConfig = _.defaultsDeep(
    extendArtifactsConfig({
      rootDir: cliConfig.artifactsLocation,
      plugins: {
        log: cliConfig.recordLogs,
        screenshot: cliConfig.takeScreenshots,
        video: cliConfig.recordVideos,
        instruments: cliConfig.recordPerformance,
        timeline: cliConfig.recordTimeline,
      },
    }),
    extendArtifactsConfig(deviceConfig.artifacts),
    extendArtifactsConfig(detoxConfig.artifacts),
    extendArtifactsConfig({
      rootDir: 'artifacts',
      pathBuilder: null,
      plugins: {
        log: 'none',
        screenshot: 'manual',
        video: 'none',
        instruments: 'none',
        timeline: 'none',
      },
    }),
  );

  artifactsConfig.rootDir = buildDefaultArtifactsRootDirpath(
    configurationName,
    artifactsConfig.rootDir
  );

  artifactsConfig.pathBuilder = resolveArtifactsPathBuilder(artifactsConfig);

  return artifactsConfig;
}

function extendArtifactsConfig(config) {
  const p = config && config.plugins;
  if (!p) {
    return config;
  }

  return {
    ...config,
    plugins: {
      ...config.plugins,
      log: ifString(p.log, LogArtifactPlugin.parseConfig),
      screenshot: ifString(p.screenshot, ScreenshotArtifactPlugin.parseConfig),
      video: ifString(p.video, VideoArtifactPlugin.parseConfig),
      instruments: ifString(p.instruments, InstrumentsArtifactPlugin.parseConfig),
      timeline: ifString(p.timeline, TimelineArtifactPlugin.parseConfig),
      uiHierarchy: ifString(p.uiHierarchy, IosUIHierarchyPlugin.parseConfig),
    },
  };
}

function resolveArtifactsPathBuilder(artifactsConfig) {
  let { rootDir, pathBuilder } = artifactsConfig;

  if (typeof pathBuilder === 'string') {
    pathBuilder = resolveModuleFromPath(pathBuilder);
  }

  if (typeof pathBuilder === 'function') {
    try {
      pathBuilder = pathBuilder({ rootDir });
    } catch (e) {
      pathBuilder = new pathBuilder({ rootDir });
    }
  }

  if (!pathBuilder) {
    pathBuilder = new ArtifactPathBuilder({ rootDir });
  }

  return pathBuilder;
}

function ifString(value, mapper) {
  return typeof value === 'string' ? mapper(value) : value;
}

module.exports = composeArtifactsConfig;
