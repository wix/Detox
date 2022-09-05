const _ = require('lodash');

describe('composeBehaviorConfig', () => {
  let composeBehaviorConfig;
  let cliConfig, localConfig, globalConfig;

  beforeEach(() => {
    cliConfig = {};
    localConfig = {};
    globalConfig = {};

    composeBehaviorConfig = require('./composeBehaviorConfig');
  });

  let composed = () => composeBehaviorConfig({
    cliConfig,
    localConfig,
    globalConfig,
  });

  it('should return a default behavior if nothing is set', () => {
    expect(composed()).toEqual({
      init: {
        keepLockFile: false,
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
            keepLockFile: true,
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
              keepLockFile: false,
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
    });

    describe('if CLI config is set', () => {
      beforeEach(() => {
        cliConfig = {
          keepLockFile: true,
          reuse: true,
          cleanup: true,
        };
      });

      it('should override the defaults from global config', () => {
        expect(composed()).toEqual(expect.objectContaining({
          init: expect.objectContaining({
            keepLockFile: true,
            reinstallApp: false,
          }),
          cleanup: expect.objectContaining({
            shutdownDevice: true,
          }),
        }));
      });
    });
  });
});
