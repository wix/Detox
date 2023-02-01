const os = require('os');
const path = require('path');

describe('loadExternalConfig', () => {
  const DIR_PACKAGEJSON = path.join(__dirname, '__mocks__/configuration/packagejson');
  const DIR_PRIORITY = path.join(__dirname, '__mocks__/configuration/priority');
  const DIR_EXTENDS = path.join(__dirname, '__mocks__/configuration/extends');
  const DIR_BADCONFIG = path.join(__dirname, '__mocks__/configuration/badconfig');

  let DetoxConfigErrorComposer;
  /** @type {DetoxConfigErrorComposer} */
  let errorComposer;
  let loadExternalConfig;
  let logger;

  beforeEach(() => {
    jest.mock('../utils/logger');
    logger = require('../utils/logger');

    DetoxConfigErrorComposer = require('../errors/DetoxConfigErrorComposer');
    errorComposer = new DetoxConfigErrorComposer();

    loadExternalConfig = (opts) => require('./loadExternalConfig')({
      cwd: process.cwd(),
      errorComposer,
      ...opts,
    });
  });

  it('should implicitly use .detoxrc.js, even if there is package.json', async () => {
    const { filepath, config } = await loadExternalConfig({ cwd: DIR_PRIORITY });

    expect(filepath).toBe(path.join(DIR_PRIORITY, '.detoxrc.js'));
    expect(config).toMatchObject({ configurations: expect.anything() });
    expect(logger.warn).not.toHaveBeenCalled();
  });

  it('should implicitly use package.json, even if there is no .detoxrc', async () => {
    const { filepath, config } = await loadExternalConfig({ cwd: DIR_PACKAGEJSON });

    expect(filepath).toBe(path.join(DIR_PACKAGEJSON, 'package.json'));
    expect(config).toMatchObject({ configurations: expect.anything() });
    expect(logger.warn).not.toHaveBeenCalled();
  });

  it('should return an empty result if a config cannot be implicitly found', async () => {
    const result = await loadExternalConfig({ cwd: os.homedir() });
    expect(result).toBe(null);
  });

  it('should explicitly use the specified config (via env-cli args)', async () => {
    const configPath = path.join(DIR_PRIORITY, 'detox-config.json');
    const { filepath, config } = await loadExternalConfig({ configPath });

    expect(filepath).toBe(configPath);
    expect(config).toMatchObject({ configurations: expect.anything() });
    expect(logger.warn).not.toHaveBeenCalled();
  });

  it('should merge in the base config from "extends" property', async () => {
    const { filepath, config } = await loadExternalConfig({ cwd: DIR_EXTENDS });

    expect(filepath).toBe(path.join(DIR_EXTENDS, '.detoxrc.json'));
    expect(config).toEqual({
      extends: './middle',
      artifacts: {
        rootDir: 'someRootDir',
        plugins: {
          log: 'all',
          screenshot: 'all',
          video: 'all',
        },
      },
    });
  });

  it('should throw noConfigurationAtGivenPath error if the explicitly given config is not found', async () => {
    const configPath = path.join(DIR_PRIORITY, 'non-existent.json');

    await expect(loadExternalConfig({ configPath })).rejects.toThrowError(
      errorComposer.noConfigurationAtGivenPath(configPath)
    );
  });

  it('should throw noConfigurationAtGivenPath error if the "extends" base config is not found', async () => {
    const configPath = path.join(DIR_EXTENDS, 'badPointer.json');

    await expect(loadExternalConfig({ configPath })).rejects.toThrowError(
      errorComposer
        .setDetoxConfigPath(configPath)
        .setExtends(true)
        .noConfigurationAtGivenPath(require(configPath).extends)
    );
  });

  it('should throw failedToReadConfiguration error if the implicitly resolved config throws "Cannot find module..."', async () => {
    await expect(loadExternalConfig({ cwd: DIR_BADCONFIG })).rejects.toThrowError('something-that-does-not-exist');
  });

  it('should fall back to fs-based config path resolution', () => {
    const absoluteConfigPath = path.join(DIR_PRIORITY, 'detox-config.json');
    const relativeConfigPath = path.relative(process.cwd(), absoluteConfigPath);

    const absoluteConfig = loadExternalConfig({ configPath: absoluteConfigPath });
    expect(logger.warn).not.toHaveBeenCalled();
    const relativeConfig = loadExternalConfig({ configPath: relativeConfigPath });
    expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('legacy filesystem'));

    expect(absoluteConfig).toEqual(relativeConfig);
  });

  it('should rethrow if an unexpected error occurs', async () => {
    const configPath = os.homedir();

    await expect(loadExternalConfig({ configPath })).rejects.toThrowError(/EISDIR/);
  });
});
