describe('getConfigurationFile', () => {
  let ConfigurationResolver = require('./ConfigurationResolver');
  

  it(`gets default config from package.json when no configuration path is provided`, async () => {
    const fixture = `${__dirname}/__mocks__/configuration-resolver/detoxrc-and-package-json-and-config`
    const configResolver = new ConfigurationResolver(fixture);

    const config = configResolver.getDetoxConfiguration();
    expect(config).toBeDefined();
    expect(config['test']).toEqual("package.json");
  });

  it(`gets config from provided config-path`, () => {
    const fixture = `${__dirname}/__mocks__/configuration-resolver/detoxrc-and-package-json-and-config`
    const configResolver = new ConfigurationResolver(fixture);

    const config = configResolver.getDetoxConfiguration('./detox-config.json');
    expect(config).toBeDefined();
    expect(config['test']).toEqual("some-config.json");
  });

  it(`fails to get config from provided config-path when path does not exist`, () => {
    const fixture = `${__dirname}/__mocks__/configuration-resolver/detoxrc-and-package-json-and-config`
    const configResolver = new ConfigurationResolver(fixture);

    const config = configResolver.getDetoxConfiguration('./some-other-config.json');
    expect(config).toBeNull();
  });


  it(`gets config from .detoxrc when no detox in package.json is found and no config is provided`, () => {
    const fixture = `${__dirname}/__mocks__/configuration-resolver/detoxrc`
    const configResolver = new ConfigurationResolver(fixture);

    const config = configResolver.getDetoxConfiguration();
    expect(config).toBeDefined();
    expect(config['test']).toEqual(".detoxrc");
  });
});