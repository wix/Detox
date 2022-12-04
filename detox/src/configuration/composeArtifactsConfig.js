// @ts-nocheck
const _ = require('lodash');

const InstrumentsArtifactPlugin = require('../artifacts/instruments/InstrumentsArtifactPlugin');
const LogArtifactPlugin = require('../artifacts/log/LogArtifactPlugin');
const ScreenshotArtifactPlugin = require('../artifacts/screenshot/ScreenshotArtifactPlugin');
const IosUIHierarchyPlugin = require('../artifacts/uiHierarchy/IosUIHierarchyPlugin');
const buildDefaultArtifactsRootDirpath = require('../artifacts/utils/buildDefaultArtifactsRootDirpath');
const VideoArtifactPlugin = require('../artifacts/video/VideoArtifactPlugin');

/**
 * @param {*} cliConfig
 * @param {string} configurationName
 * @param {Detox.DetoxConfig} globalConfig
 * @param {Detox.DetoxConfiguration} localConfig
 */
function composeArtifactsConfig({
  cliConfig,
  configurationName,
  localConfig,
  globalConfig,
}) {
  const artifactsConfig = _.defaultsDeep(
    extendArtifactsConfig({
      rootDir: cliConfig.artifactsLocation,
      plugins: {
        log: cliConfig.recordLogs,
        screenshot: cliConfig.takeScreenshots,
        video: cliConfig.recordVideos,
        instruments: cliConfig.recordPerformance,
        uiHierarchy: cliConfig.captureViewHierarchy,
      },
    }),
    extendArtifactsConfig(localConfig.artifacts),
    extendArtifactsConfig(globalConfig.artifacts),
    extendArtifactsConfig(false),
  );

  if (!artifactsConfig.pathBuilder) {
    artifactsConfig.pathBuilder = undefined;
  }

  artifactsConfig.rootDir = buildDefaultArtifactsRootDirpath(
    configurationName,
    artifactsConfig.rootDir
  );

  return artifactsConfig;
}

function extendArtifactsConfig(config) {
  if (config === false) {
    return extendArtifactsConfig({
      rootDir: 'artifacts',
      pathBuilder: '',
      plugins: {
        log: 'none',
        screenshot: 'manual',
        video: 'none',
        instruments: 'none',
        uiHierarchy: 'disabled',
      },
    });
  }

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
      uiHierarchy: ifString(p.uiHierarchy, IosUIHierarchyPlugin.parseConfig),
    },
  };
}

function ifString(value, mapper) {
  return typeof value === 'string' ? mapper(value) : value;
}

module.exports = composeArtifactsConfig;
