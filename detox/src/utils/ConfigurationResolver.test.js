const fs = require('fs');
const pathToFiles = `${__dirname}/__ConfigurationResolverFiles__`

describe('getConfigurationFile', () => {
  let ConfigurationResolver = require('./ConfigurationResolver');
  let configResolver;
  
  beforeAll(() => {
    !fs.existsSync(pathToFiles) && fs.mkdirSync(pathToFiles);
  });

  afterAll(() => {
    deleteConfigFilesSync()
    fs.rmdirSync(pathToFiles);
  });

  beforeEach(() => {
    configResolver = new ConfigurationResolver(pathToFiles);

    deleteConfigFilesSync()
  });

  it(`gets default config from package.json when no configuration path is provided`, async () => {
    writeDetoxConfig()
    writePackageJsonConfig()

    const config = configResolver.getDetoxConfiguration();
    expect(config).toBeDefined();
    expect(config['test']).toEqual("package.json");
  });

  it(`gets config from provided config-path`, () => {
    writeConfigPathConfig();
    const config = configResolver.getDetoxConfiguration('./some-config.json');
    expect(config).toBeDefined();
    expect(config['test']).toEqual("some-config.json");
  });

  it(`gets config from .detoxrc when no detox in package.json is found and no config is provided`, () => {
    fs.writeFileSync(`${pathToFiles}/package.json`, JSON.stringify({}))
    writeDetoxConfig()

    const config = configResolver.getDetoxConfiguration();
    expect(config).toBeDefined();
    expect(config['test']).toEqual(".detoxrc");
  });
});

const writeDetoxConfig = () => fs.writeFileSync(`${pathToFiles}/.detoxrc`, JSON.stringify({"test": ".detoxrc"}))
const writePackageJsonConfig = () => fs.writeFileSync(`${pathToFiles}/package.json`, JSON.stringify({"detox": {"test": "package.json"}}))
const writeConfigPathConfig = () => fs.writeFileSync(`${pathToFiles}/some-config.json`, JSON.stringify({"test": "some-config.json"}))

const deleteConfigFilesSync = () => {
    fs.existsSync(`${pathToFiles}/package.json`) && fs.unlinkSync(`${pathToFiles}/package.json`)
    fs.existsSync(`${pathToFiles}/.detoxrc`) && fs.unlinkSync(`${pathToFiles}/.detoxrc`)
    fs.existsSync(`${pathToFiles}/some-config.json`) && fs.unlinkSync(`${pathToFiles}/some-config.json`)
}