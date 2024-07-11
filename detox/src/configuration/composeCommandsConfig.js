/**
 * @param {{
 *  appsConfig: Record<string, Detox.DetoxAppConfig>
 *  localConfig: Detox.DetoxConfiguration;
 * }} options
 * @returns {DetoxInternals.RuntimeCommandsGroup[]}
 */
function composeCommandsConfig(options) {
  const { appsConfig, localConfig } = options;
  /** @type {[string | undefined, Detox.DetoxAppConfig | Detox.DetoxConfiguration][]} */
  const entries = [[undefined, localConfig], ...Object.entries(appsConfig)];

  return entries.map(extractGroup).filter(hasCommands);
}

/**
 * @param {[string | undefined, any]} script
 * @param {number} index
 * @param {[string | undefined, any][]} array
 * @returns {DetoxInternals.RuntimeCommandsGroup}
 */
function extractGroup([appName, { build, start }], index, [[, config]]) {
  if (index === 0) {
    return { build, start };
  }

  return {
    appName,
    build: config.build ? undefined : build,
    start: config.start ? undefined : start
  };
}

/**
 * @param {DetoxInternals.RuntimeCommandsGroup} script
 * @returns {boolean}
 */
function hasCommands({ build, start }) {
  return Boolean(build || start);
}

module.exports = composeCommandsConfig;
