// @ts-nocheck
const _ = require('lodash');

const logger = require('../../src/utils/logger').child({ cat: 'config' });
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
    configurationName !== 'android.cloud.release' ? extendArtifactsConfig({
      rootDir: cliConfig.artifactsLocation,
      plugins: {
        log: cliConfig.recordLogs,
        screenshot: cliConfig.takeScreenshots,
        video: cliConfig.recordVideos,
        instruments: cliConfig.recordPerformance,
        uiHierarchy: cliConfig.captureViewHierarchy,
      },
    }) : {},
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

  if (configurationName === 'android.cloud.release') {
    validateCloudConfig(artifactsConfig);
  }
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

function validateCloudConfig(artifactsConfig) {
  var plugins = artifactsConfig && artifactsConfig.plugins;
  const cloudSupportedLogs = ['video', 'deviceLogs', 'networkLogs'];
  const cloudSupportedCaps = ['plugins'];
  plugins = cloudSupportedLogs.reduce((accumulator, plugin) => {
    const defaultEnabled = plugin == 'video' ? true : false;
    if (typeof accumulator[plugin] === 'object' && Object.keys(accumulator[plugin]).length > 1) {
      logger.warn(`[ArtifactsConfig] Only the all and none presets are honoured in the ${plugin} plugin for device type 'android.cloud' and default is enabled:${defaultEnabled}.`);
    }
    const enabled = _.get(accumulator, `${plugin}.enabled`);
    if (accumulator[plugin] && enabled) {
        accumulator[plugin] = {
            'enabled': enabled
        };
    }
    else {
        accumulator[plugin] = {
            'enabled': defaultEnabled
        };
    }
    return accumulator;
  }, plugins);
  let ignoredCloudConfigParams = _.difference(Object.keys(artifactsConfig), cloudSupportedCaps);
  ignoredCloudConfigParams = ignoredCloudConfigParams.concat(_.difference(Object.keys(plugins), cloudSupportedLogs));
  if (ignoredCloudConfigParams.length > 0)
    logger.warn(`[ArtifactsConfig] The properties ${ignoredCloudConfigParams} are not honoured for device type 'android.cloud'.`);
  // Should I delete the ignored properties also?
}

module.exports = composeArtifactsConfig;
