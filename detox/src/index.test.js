// @ts-nocheck
const _ = require('lodash');

jest.mock('./utils/logger');
jest.mock('./utils/trace');
jest.mock('./configuration');
jest.mock('./utils/MissingDetox');
jest.mock('./Detox');

const testUtils = {
  randomObject: () => ({ [Math.random()]: Math.random() }),
};

describe('index (regular)', () => {
  let logger;
  let configuration;
  let Detox;
  let detox;
  let detoxConfig;
  let detoxInstance;

  beforeEach(() => {
    // valid enough configuration to pass with mocked dependencies
    detoxConfig = {
      behaviorConfig: {
        init: {
          exposeGlobals: _.sample([false, true]),
        },
      },
    };

    logger = require('./utils/logger');
    configuration = require('./configuration');
    configuration.composeDetoxConfig.mockImplementation(async () => detoxConfig);

    Detox = require('./Detox');

    const MissingDetox = require('./utils/MissingDetox');
    Detox.none = new MissingDetox();
    detox = require('./index')._setGlobal(global);
    detoxInstance = null;
  });

  describe('public interface', () => {
    it.each([
      ['an', 'object',   'DetoxConstants'],
      ['an', 'object',   'by'],
      ['an', 'object',   'device'],
      ['a',  'function', 'init'],
      ['a',  'function', 'cleanup'],
      ['a',  'function', 'beforeEach'],
      ['a',  'function', 'afterEach'],
      ['a',  'function', 'suiteStart'],
      ['a',  'function', 'suiteEnd'],
      ['a',  'function', 'element'],
      ['a',  'function', 'expect'],
      ['a',  'function', 'waitFor'],
      ['an',  'object',   'web'],
    ])('should export %s %s called .%s', (_1, type, name) => {
      expect(typeof detox[name]).toBe(type);
    });
  });

  describe('detox.init(config[, userParams])', () => {
    it(`should pass args via calling configuration.composeDetoxConfig({ override, userParams })`, async () => {
      const [config, userParams] = [1, 2].map(testUtils.randomObject);
      await detox.init(config, userParams).catch(() => {});

      expect(configuration.composeDetoxConfig).toHaveBeenCalledWith({
        override: config,
        userParams
      });
    });

    describe('when configuration is valid', () => {
      beforeEach(async () => {
        detoxInstance = await detox.init();
      });

      it(`should create a Detox instance with the composed config object`, () =>
        expect(Detox).toHaveBeenCalledWith(detoxConfig));

      it(`should return a Detox instance`, () =>
        expect(detoxInstance).toBeInstanceOf(Detox));

      it(`should set the last error to be null in Detox.none's storage`, () =>
        expect(Detox.none.setError).toHaveBeenCalledWith(null));
    });

    describe('when configuration is invalid', () => {
      let configError, initPromise;

      beforeEach(async () => {
        configError = new Error('Configuration test error');

        configuration.composeDetoxConfig.mockImplementation(async () => {
          throw configError;
        });

        initPromise = detox.init();
        await initPromise.catch(() => {});
      });

      it(`should rethrow that configuration error`, async () => {
        await expect(initPromise).rejects.toThrowError(configError);
      });

      it(`should not create a Detox instance`, () => {
        expect(Detox).not.toHaveBeenCalled();
      });

      it(`should always mutate global with Detox.none vars`, async () => {
        expect(Detox.none.initContext).toHaveBeenCalledWith(global);
      });

      it(`should set the last error to Detox.none's storage`, async () => {
        expect(Detox.none.setError).toHaveBeenCalledWith(configError);
      });

      it(`should log that error with the logger`, async () => {
        expect(logger.error).toHaveBeenCalledWith(
          { event: 'DETOX_INIT_ERROR' },
          '\n',
          configError
        );
      });
    });

    describe('when detox.init() throws with _suppressLoggingInitErrors() configuration', () => {
      beforeEach(async () => {
        configuration.composeDetoxConfig.mockImplementation(async () => {
          throw new Error('Configuration test error');
        });

        detox._suppressLoggingInitErrors();
        await detox.init().catch(() => {});
      });

      it(`should not log init errors with the logger`, async () => {
        expect(logger.error).not.toHaveBeenCalled();
      });
    });

    describe('when behaviorConfig.init.exposeGlobals = true', () => {
      beforeEach(async () => {
        detoxConfig.behaviorConfig.init.exposeGlobals = true;
        detoxInstance = await detox.init();
      });

      it(`should touch globals with Detox.none.initContext`, () => {
        expect(Detox.none.initContext).toHaveBeenCalledWith(global);
      });
    });

    describe('when behaviorConfig.init.exposeGlobals = false', () => {
      beforeEach(async () => {
        detoxConfig.behaviorConfig.init.exposeGlobals = false;
        detoxInstance = await detox.init();
      });

      it(`should not touch globals with Detox.none.initContext`, () => {
        expect(Detox.none.initContext).not.toHaveBeenCalled();
      });
    });

    describe('global API', () => {
      const configs = {
        deviceConfig: {
          mock: 'config',
        },
      };

      const givenConfigResolveError = (error = new Error()) => configuration.composeDetoxConfig.mockRejectedValue(error);

      beforeEach(() => {
        configuration.composeDetoxConfig.mockResolvedValue(configs);

        Detox.globalInit = jest.fn();
        Detox.globalCleanup = jest.fn();
      });

      it('should global-init the actual Detox', async () => {
        await detox.globalInit();
        expect(Detox.globalInit).toHaveBeenCalledWith(configs);
      });

      it('should throw if global init fails', async () => {
        const error = new Error('config error');
        givenConfigResolveError(error);
        await expect(detox.globalInit()).rejects.toThrowError(error);
      });

      it('should custom-log init failures', async () => {
        givenConfigResolveError();

        try {
          await detox.globalInit();
        } catch(e) {}
        expect(logger.warn).toHaveBeenCalledWith({ event: 'GLOBAL_INIT' }, expect.any(String));
      });

      it('should global-cleanup the actual Detox', async () => {
        await detox.globalCleanup();
        expect(Detox.globalCleanup).toHaveBeenCalledWith(configs);
      });

      it('should NOT throw if global cleanup fails', async () => {
        const error = new Error('config error');
        givenConfigResolveError(error);
        await detox.globalCleanup();
      });

      it('should custom-log cleanup failures', async () => {
        const error = new Error('mock error');
        givenConfigResolveError(error);

        try {
          await detox.globalCleanup();
        } catch(e) {}
        expect(logger.warn).toHaveBeenCalledWith({ event: 'GLOBAL_CLEANUP' }, expect.any(String), error);
      });
    });
  });

  describe('detox.cleanup()', () => {
    describe('when called before detox.init()', () => {
      beforeEach(() => detox.cleanup());

      it('should nevertheless cleanup globals with Detox.none.cleanupContext', () =>
        expect(Detox.none.cleanupContext).toHaveBeenCalledWith(global));
    });

    describe('when called after detox.init()', () => {
      beforeEach(async () => {
        detoxInstance = await detox.init();
        await detox.cleanup();
      });

      it('should call cleanup in the current Detox instance', () =>
        expect(detoxInstance.cleanup).toHaveBeenCalled());

      it('should call cleanup globals with Detox.none.cleanupContext', () =>
        expect(Detox.none.cleanupContext).toHaveBeenCalledWith(global));

      describe('twice', () => {
        beforeEach(() => detox.cleanup());

        it('should not call cleanup twice in the former Detox instance', () =>
          expect(detoxInstance.cleanup).toHaveBeenCalledTimes(1));
      });
    });
  });

  describe.each([
    ['beforeEach'],
    ['afterEach'],
    ['suiteStart'],
    ['suiteEnd'],
    ['element'],
    ['expect'],
    ['waitFor'],
  ])('detox.%s()', (method) => {
    let randomArgs;

    beforeEach(() => {
      randomArgs = [1, 2].map(testUtils.randomObject);
    });

    describe('before detox.init() has been called', () => {
      beforeEach(() => {
        Detox.none[method] = jest.fn();
      });

      it(`should forward calls to the Detox.none instance`, async () => {
        await detox[method](...randomArgs);
        expect(Detox.none[method]).toHaveBeenCalledWith(...randomArgs);
      });
    });

    describe('after detox.init() has been called', () => {
      beforeEach(async () => {
        detoxConfig = { behaviorConfig: { init: {} } };
        detoxInstance = await detox.init();
        detoxInstance[method] = jest.fn();
      });

      it(`should forward calls to the current Detox instance`, async () => {
        await detoxInstance[method](...randomArgs);
        expect(detoxInstance[method]).toHaveBeenCalledWith(...randomArgs);
      });
    });
  });

  describe.each([
    ['by'],
    ['device'],
  ])('detox.%s', (property) => {
    describe('before detox.init() has been called', () => {
      beforeEach(() => {
        Detox.none[property] = testUtils.randomObject();
      });

      it(`should return value of Detox.none["${property}"]`, () => {
        expect(detox[property]).toEqual(Detox.none[property]);
      });
    });

    describe('after detox.init() has been called', () => {
      beforeEach(async () => {
        detoxConfig = { behaviorConfig: { init: {} } };
        detoxInstance = await detox.init();
        detoxInstance[property] = testUtils.randomObject();
      });

      it(`should forward calls to the current Detox instance`, () => {
        expect(detox[property]).toEqual(detoxInstance[property]);
      });
    });
  });
});

describe(':ios: test', () => {
  it('should pass', () => {});
});

describe(':android: test', () => {
  it('should pass 1', () => {});
  it('should pass 2', () => {});
});

describe('index (global detox variable injected with Jest Circus)', () => {
  beforeEach(() => {
    if (global.detox) {
      throw new Error('detox property should not be in globals during unit tests');
    }

    global.detox = jest.fn();
  });

  afterEach(() => {
    delete global.detox;
  });

  it('should reexport global.detox', () => {
    expect(require('./index')).toBe(global.detox);
  });
});
