describe('composeLoggerConfig', () => {
  let composeLoggerConfig;
  let cliConfig, localConfig, globalConfig;

  beforeEach(() => {
    cliConfig = {};
    localConfig = {};
    globalConfig = {};

    composeLoggerConfig = require('./composeLoggerConfig');
  });

  let composed = () => composeLoggerConfig({
    cliConfig,
    localConfig,
    globalConfig,
  });

  it('should return a default behavior if nothing is set', () => {
    expect(composed()).toEqual({
      level: 'info',
      overrideConsole: 'sandbox',
      options: {
        showDate: expect.any(Function),
        showLoggerName: true,
        showPid: true,
        showMetadata: false,
        basepath: expect.any(String),
        prefixers: {
          '__filename': expect.any(Function),
          'trackingId': expect.any(Function),
          'cpid': expect.any(Function),
        },
      },
    });
  });

  describe.each([
    ['local config'],
    ['global config'],
  ])('if a %s has overrides', (description) => {
    beforeEach(() => {
      const config = description.startsWith('local') ? localConfig : globalConfig;
      config.logger = {
        level: 'debug',
        overrideConsole: 'all',
        options: {
          showLoggerName: false,
          prefixers: {
            somethingElse: jest.fn(),
          }
        },
      };
    });

    it('should apply them upon the defaults', () => {
      expect(composed()).toEqual({
        level: 'debug',
        overrideConsole: 'all',
        options: expect.objectContaining({
          showLoggerName: false,
          showPid: true,
          prefixers: expect.objectContaining({
            '__filename': expect.any(Function),
            somethingElse: expect.any(Function),
          }),
        }),
      });
    });
  });

  describe('if a CLI config has overrides', () => {
    beforeEach(() => {
      cliConfig.loglevel = 'trace';
      cliConfig.noColor = true;
      cliConfig.useCustomLogger = false;
    });

    it('should apply them upon the defaults', () => {
      expect(composed()).toEqual({
        level: 'trace',
        overrideConsole: 'none',
        options: expect.objectContaining({
          colors: false,
          showPid: true,
        }),
      });
    });

    it('should adapt loglevel=verbose -> debug', () => {
      cliConfig.loglevel = 'verbose';

      expect(composed()).toEqual(expect.objectContaining({
        level: 'debug',
      }));
    });
  });

  test('configs should have priority: CLI > local > global > defaults', () => {
    globalConfig.logger = {
      level: 'warn',
      overrideConsole: 'none',
      options: {
        colors: {},
        indent: '\t',
        showDate: jest.fn(),
      },
    };

    localConfig.logger = {
      level: 'error',
      overrideConsole: 'sandbox',
      options: {
        colors: { 40: 'yellow' },
        showDate: jest.fn(),
      },
    };

    cliConfig = {
      loglevel: 'fatal',
      noColor: true,
      useCustomLogger: true,
    };

    expect(composed()).toEqual({
      level: 'fatal',
      overrideConsole: 'all',
      options: expect.objectContaining({
        colors: false,
        indent: '\t',
        showDate: localConfig.logger.options.showDate,
      }),
    });
  });
});
