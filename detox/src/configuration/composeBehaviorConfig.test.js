const _ = require('lodash');

describe('composeBehaviorConfig', () => {
  let composeBehaviorConfig;
  let cliConfig, localConfig, globalConfig, userParams;

  beforeEach(() => {
    cliConfig = {};
    localConfig = {};
    globalConfig = {};
    userParams = {};

    composeBehaviorConfig = require('./composeBehaviorConfig');
  });

  let composed = () => composeBehaviorConfig({
    cliConfig,
    localConfig,
    globalConfig,
    userParams,
  });

  it('should return a default behavior if nothing is set', () => {
    expect(composed()).toEqual({
      init: {
        exposeGlobals: true,
        reinstallApp: true,
      },
      launchApp: 'auto',
      cleanup: {
        shutdownDevice: false,
      },
    });
  });

  describe('if a custom config has only .launchApp = "manual" override', () => {
    beforeEach(() => {
      globalConfig = {
        behavior: { launchApp: 'manual' }
      };
    });

    it('should implicitly override behavior.init.reinstallApp = false', () => {
      const actual = composed();

      expect(actual.init.reinstallApp).toBe(false);
    });
  });

  describe('if global config is set', () => {
    beforeEach(() => {
      globalConfig = {
        behavior: {
          init: {
            exposeGlobals: false,
            reinstallApp: false,
          },
          launchApp: 'manual',
          cleanup: {
            shutdownDevice: true,
          },
        },
      };
    });

    it('should override the defaults', () => {
      const expected = _.cloneDeep(globalConfig.behavior);
      const actual = composed();

      expect(actual).toEqual(expected);
    });

    describe('if local config is set', () => {
      beforeEach(() => {
        localConfig = {
          behavior: {
            init: {
              exposeGlobals: true,
              reinstallApp: true,
            },
            launchApp: 'auto',
            cleanup: {
              shutdownDevice: false,
            },
          },
        };
      });

      it('should override the defaults from global config', () => {
        const expected = _.cloneDeep(localConfig.behavior);
        const actual = composed();

        expect(actual).toEqual(expected);
      });

      describe('if user params is set', () => {
        beforeEach(() => {
          userParams = {
            initGlobals: false,
            reuse: false,
          };
        });

        it('should override the defaults from local config', () => {
          expect(composed()).toEqual({
            init: {
              exposeGlobals: false,
              reinstallApp: true,
            },
            launchApp: 'auto',
            cleanup: {
              shutdownDevice: false,
            }
          });
        });

        describe('if cli args are set', () => {
          beforeEach(() => {
            cliConfig.reuse = true;
            cliConfig.cleanup = true;
          });

          it('should override the user params', () => {
            expect(composed()).toEqual({
              init: {
                exposeGlobals: false,
                reinstallApp: false,
              },
              launchApp: 'auto',
              cleanup: {
                shutdownDevice: true,
              }
            });
          });
        });
      });
    });
  });
});
