const path = require('path');
const os = require('os');
const DetoxConfigErrorBuilder = require('../errors/DetoxConfigErrorBuilder');

describe('loadExternalConfig', () => {
  const DIR_PACKAGEJSON = path.join(__dirname, '__mocks__/configuration/packagejson');
  const DIR_PRIORITY = path.join(__dirname, '__mocks__/configuration/priority');

  /** @type {DetoxConfigErrorBuilder} */
  let errorBuilder;
  let loadExternalConfig;

  beforeEach(() => {
    errorBuilder = new DetoxConfigErrorBuilder();

    loadExternalConfig = (opts) => require('./loadExternalConfig')({
      ...opts,
      errorBuilder,
    });
  });

  it('should implicitly use .detoxrc.js, even if there is package.json', async () => {
    const { filepath, config } = await loadExternalConfig({ cwd: DIR_PRIORITY });

    expect(filepath).toBe(path.join(DIR_PRIORITY, '.detoxrc.js'))
    expect(config).toMatchObject({ configurations: expect.anything() });
  });

  it('should implicitly use package.json, even if there is no .detoxrc', async () => {
    const { filepath, config } = await loadExternalConfig({ cwd: DIR_PACKAGEJSON });

    expect(filepath).toBe(path.join(DIR_PACKAGEJSON, 'package.json'))
    expect(config).toMatchObject({ configurations: expect.anything() });
  });

  it('should return an empty result if a config cannot be implicitly found', async () => {
    const result = await loadExternalConfig({ cwd: os.homedir() });
    expect(result).toBe(null);
  });

  it('should explicitly use the specified config (via env-cli args)', async () => {
    const configPath = path.join(DIR_PRIORITY, 'detox-config.json');
    const { filepath, config } = await loadExternalConfig({ configPath });

    expect(filepath).toBe(configPath)
    expect(config).toMatchObject({ configurations: expect.anything() });
  });

  it('should throw if the explicitly given config is not found', async () => {
    const configPath = path.join(DIR_PRIORITY, 'non-existent.json');

    await expect(loadExternalConfig({ configPath })).rejects.toThrowError(
      errorBuilder.noConfigurationAtGivenPath()
    );
  });

  it('should rethrow if an unexpected error occurs', async () => {
    const configPath = os.homedir();

    await expect(loadExternalConfig({ configPath })).rejects.toThrowError(/EISDIR/);
  });
});
