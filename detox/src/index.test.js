const _ = require('lodash');

jest.mock('./utils/logger');
jest.mock('./configuration');
jest.mock('./utils/MissingDetox');
jest.mock('./Detox');

const testUtils = {
  randomObject: () => ({ [Math.random()]: Math.random() }),
};

describe('index', () => {
  let logger;
  let configuration;
  let Detox;
  let index;
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

    index = require('./index');
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
    ])('should export %s %s called .%s', (_1, type, name) => {
      expect(typeof index[name]).toBe(type);
    });
  });

  describe('detox.init(config[, userParams])', () => {
    it(`should pass args via calling configuration.composeDetoxConfig(config, userParams)`, async () => {
      const [config, userParams] = [1, 2].map(testUtils.randomObject);
      await index.init(config, userParams).catch(() => {});

      expect(configuration.composeDetoxConfig).toHaveBeenCalledWith({
        selectedConfiguration: undefined,
        override: config,
        userParams
      });
    });

    describe('when configuration is valid', () => {
      beforeEach(async () => {
        detox = await index.init();
      });

      it(`should create a Detox instance with the composed config object`, () =>
        expect(Detox).toHaveBeenCalledWith(detoxConfig));

      it(`should return a Detox instance`, () =>
        expect(detox).toBeInstanceOf(Detox));

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

        initPromise = index.init();
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

    describe('when behaviorConfig.init.exposeGlobals = true', () => {
      beforeEach(async () => {
        detoxConfig.behaviorConfig.init.exposeGlobals = true;
        detox = await index.init();
      });

      it(`should touch globals with Detox.none.initContext`, () => {
        expect(Detox.none.initContext).toHaveBeenCalledWith(global);
      });
    });

    describe('when behaviorConfig.init.exposeGlobals = false', () => {
      beforeEach(async () => {
        detoxConfig.behaviorConfig.init.exposeGlobals = false;
        detox = await index.init();
      });

      it(`should not touch globals with Detox.none.initContext`, () => {
        expect(Detox.none.initContext).not.toHaveBeenCalled();
      });
    });
  });

  describe('detox.cleanup()', () => {
    describe('when called before detox.init()', () => {
      beforeEach(() => index.cleanup());

      it('should nevertheless cleanup globals with Detox.none.cleanupContext', () =>
        expect(Detox.none.cleanupContext).toHaveBeenCalledWith(global));
    });

    describe('when called after detox.init()', () => {
      beforeEach(async () => {
        detox = await index.init();
        await index.cleanup();
      });

      it('should call cleanup in the current Detox instance', () =>
        expect(detox.cleanup).toHaveBeenCalled());

      it('should call cleanup globals with Detox.none.cleanupContext', () =>
        expect(Detox.none.cleanupContext).toHaveBeenCalledWith(global));

      describe('twice', () => {
        beforeEach(() => index.cleanup());

        it('should not call cleanup twice in the former Detox instance', () =>
          expect(detox.cleanup).toHaveBeenCalledTimes(1));
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
        await index[method](...randomArgs);
        expect(Detox.none[method]).toHaveBeenCalledWith(...randomArgs);
      });
    });

    describe('after detox.init() has been called', () => {
      beforeEach(async () => {
        detoxConfig = { behaviorConfig: { init: {} } };
        detoxInstance = await index.init();
        detoxInstance[method] = jest.fn();
      });

      it(`should forward calls to the current Detox instance`, async () => {
        await index[method](...randomArgs);
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
        expect(index[property]).toEqual(Detox.none[property]);
      });
    });

    describe('after detox.init() has been called', () => {
      beforeEach(async () => {
        detoxConfig = { behaviorConfig: { init: {} } };
        detoxInstance = await index.init();
        detoxInstance[property] = testUtils.randomObject();
      });

      it(`should forward calls to the current Detox instance`, () => {
        expect(index[property]).toEqual(detoxInstance[property]);
      });
    });
  });


});
