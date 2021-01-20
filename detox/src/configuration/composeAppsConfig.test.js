const { appWithBinaryAndBundleId } = require('./configurations.mock');
const composeAppsConfig = require('./composeAppsConfig');

describe('composeAppsConfig', () => {
  let cliConfig;
  let errorBuilder;
  let globalConfig;
  let localConfig;

  const compose = () => composeAppsConfig({
    cliConfig,
    errorBuilder,
    globalConfig,
    localConfig,
  });

  it('should return a key-value map of app configs', () => {
    localConfig = appWithBinaryAndBundleId;

    expect(compose()).toEqual({
      '': expect.objectContaining(appWithBinaryAndBundleId),
    });
  });
});
