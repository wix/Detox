const _ = require('lodash');

describe('composeBehaviorConfig', () => {
  let composeBehaviorConfig;
  let cliConfig, deviceConfig, detoxConfig, userParams;

  beforeEach(() => {
    cliConfig = {};
    deviceConfig = {};
    detoxConfig = {};
    userParams = {};

    composeBehaviorConfig = require('./composeBehaviorConfig');
  });

  let composed = () => composeBehaviorConfig({
    cliConfig,
    deviceConfig,
    detoxConfig,
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
    })
  });

  describe('if a custom config has only .launchApp = "manual" override', () => {
    beforeEach(() => {
      detoxConfig = {
        behavior: { launchApp: 'manual' }
      };
    });

    it('should implicitly override behavior.init.reinstallApp = false', () => {
      const expected = _.cloneDeep(detoxConfig.behavior);
      const actual = composed();

      expect(actual.init.reinstallApp).toBe(false);
    });
  });

  describe('if detox config is set', () => {
    beforeEach(() => {
      detoxConfig = {
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
      const expected = _.cloneDeep(detoxConfig.behavior);
      const actual = composed();

      expect(actual).toEqual(expected);
    });

    describe('if device config is set', () => {
      beforeEach(() => {
        deviceConfig = {
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

      it('should override the defaults from detox config', () => {
        const expected = _.cloneDeep(deviceConfig.behavior);
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

        it('should override the defaults from device config', () => {
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
