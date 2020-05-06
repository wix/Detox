const schemes = require('./configurations.mock');

jest.mock('./utils/logger');
jest.mock('./configuration');
jest.mock('./Detox');
jest.mock('./utils/MissingDetox');

describe('index', () => {
  let logger;
  let configuration;
  let Detox;
  let index;
  let detoxConfig;
  let detoxInstance;

  beforeEach(() => {
    detoxConfig = {
      artifactsConfig: {},
      behaviorConfig: {},
      deviceConfig: {},
      sessionConfig: {},
    };

    logger = require('./utils/logger');
    configuration = require('./configuration');
    configuration.composeDetoxConfig.mockImplementation(async () => detoxConfig);

    Detox = require('./Detox');

    const MissingDetox = require('./utils/MissingDetox');
    Detox.none = new MissingDetox();

    index = require('./index');
  });

  const randomObject = () => ({ [Math.random()]: Math.random() });

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
    it(`should pass config and userParams to configuration.composeDetoxConfig`, async () => {
      const [config, userParams] = [1, 2].map(randomObject);
      await index.init(config, userParams).catch(() => {});

      expect(configuration.composeDetoxConfig).toHaveBeenCalledWith(config, userParams);
    });

    it(`should create a Detox instance with the composed config object`, async () => {
      const config = {
        behaviorConfig: {
          init: randomObject(),
        },
      };

      configuration.composeDetoxConfig.mockImplementation(async () => config);

      await index.init();
      expect(Detox).toHaveBeenCalledWith(config);
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

      it(`should touch globals regardless of the config`, async () => {
        expect(Detox.none.initContext).toHaveBeenCalledWith(global);
      });

      it(`should set last error to Detox.none`, async () => {
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
      beforeEach(() => {
        detoxConfig.behaviorConfig.init = { exposeGlobals: true };
      });

      it(`should touch globals`, async () => {
        await index.init();
        expect(Detox.none.initContext).toHaveBeenCalledWith(global);
      });
    });

    describe('when behaviorConfig.init.exposeGlobals = false', () => {
      beforeEach(() => {
        detoxConfig.behaviorConfig.init = { exposeGlobals: false };
      });

      it(`should not touch globals`, async () => {
        await index.init();
        expect(Detox.none.initContext).not.toHaveBeenCalled();
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
      randomArgs = [randomObject(), randomObject()];
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
        Detox.none[property] = randomObject();
      });

      it(`should return value of Detox.none["${property}"]`, () => {
        expect(index[property]).toEqual(Detox.none[property]);
      });
    });

    describe('after detox.init() has been called', () => {
      beforeEach(async () => {
        detoxConfig = { behaviorConfig: { init: {} } };
        detoxInstance = await index.init();
        detoxInstance[property] = randomObject();
      });

      it(`should forward calls to the current Detox instance`, () => {
        expect(index[property]).toEqual(detoxInstance[property]);
      });
    });
  });


  // it(`throws if there was a config was invalid`, async () => {
  //   let exception;
  //
  //   try {
  //     await index.init();
  //   } catch (e) {
  //     exception = e;
  //   }
  //
  //   expect(exception).toBeDefined();
  //   expect(logger.error).toHaveBeenCalledWith({ event: 'DETOX_INIT_ERROR' }, '\n', exception);
  // });

//   it(`exposes detox globals by default`, async () => {
//     await index.init(schemes.validOneDeviceNoSession, { initGlobals: false });
//
//     expect('by' in global).toBe(false);
//   });
//
//   it(`exposes detox globals on configuration error`, async () => {
//     await index.init(schemes.validOneDeviceNoSession, { initGlobals: false });
//
//     expect('by' in global).toBe(false);
//   });
//
//   it(`does not exposes detox globals if behaviorConfig.init.exposeGlobals = false`, async () => {
//     await index.init(schemes.validOneDeviceNoSession, { initGlobals: false });
//
//     expect('by' in global).toBe(false);
//   });
//
//   it(`constructs detox without globals if initGlobals = false`, async () => {
//     await index.init(schemes.validOneDeviceNoSession, { initGlobals: false });
//
//     expect('by' in global).toBe(false);
//   });
//
//
//   it(`constructs detox with a composed config`, async () => {
//     await index.init(schemes.validOneDeviceNoSession);
//
//     // TODO: mock configuration and Detox
//     expect(Detox).toHaveBeenCalledWith({
//       artifactsConfig: expect.objectContaining({
//         plugins: schemes.pluginsDefaultsResolved,
//         pathBuilder: expect.objectContaining({
//           rootDir: expect.stringMatching(/^artifacts[\\\/]ios\.sim\.release/),
//         }),
//       }),
//       deviceConfig: schemes.validOneDeviceNoSession.configurations['ios.sim.release'],
//       session: undefined,
//     });
//   });
//
//   it(`initializes detox redirects to configuration`, async () => {
//     const params = {};
//
//     await index.init(schemes.validOneDeviceNoSession, params);
//
//     expect(mockDetox.init).toHaveBeenCalledWith(params);
//   });
//
//   it(`Basic usage`, async() => {
//     await index.init(schemes.validOneDeviceNoSession);
//     await index.cleanup();
//   });
//
//   it(`Basic usage with memorized exported objects`, async() => {
//     const { device, by } = index;
//
//     expect(() => { device, by }).not.toThrowError();
//     expect(() => { device.launchApp }).toThrowError();
//     expect(() => { by.id }).toThrowError();
//
//     await index.init(schemes.validOneDeviceNoSession);
//
//     expect(device.launchApp).toEqual(expect.any(Function));
//     expect(by.id).toEqual(expect.any(Function));
//
//     await index.cleanup();
//
//     expect(() => { device, by }).not.toThrowError();
//     expect(() => { device.launchApp }).toThrowError();
//     expect(() => { by.id }).toThrowError();
//   });
//
//   it(`Basic usage, do not throw an error if cleanup is done twice`, async() => {
//     await index.init(schemes.validOneDeviceNoSession);
//     await index.cleanup();
//     await index.cleanup();
//   });
//
//   it(`Basic usage, if detox is undefined, do not throw an error`, async() => {
//     await index.cleanup();
//   });
//
//   it.each([
//     'beforeEach',
//     'afterEach',
//     'suiteStart',
//     'suiteEnd',
//     'element',
//     'expect',
//     'waitFor',
//   ])(`%s() method should throw if currently there is no detox instance`, async (method) => {
//     await expect(index[method]()).rejects.toThrowError(/TODOTDO/);
//   });
//
//   it.each([
//     'beforeEach',
//     'afterEach',
//     'suiteStart',
//     'suiteEnd',
//     'element',
//     'expect',
//     'waitFor',
// ])(`%s() method should be forwarded to the current detox instance`, async (method) => {
//     let args = [Math.random(), Math.random()];
//     await index.init(schemes.validOneDeviceNoSession);
//     await index[method](...args);
//     expect(detoxInstance[method]).toHaveBeenCalledWith(...args);
//   });
//
//   it(`error message should be covered - with detox failed to initialize`, async() => {
//     mockDetox.init.mockReturnValue(Promise.reject(new Error('InitMe error')));
//
//     await expect(detox.init(schemes.validOneDeviceNoSession)).rejects.toThrow(/InitMe error/);
//     await detox.cleanup(); // cleaning up
//     await expect(detox.beforeEach()).rejects.toThrow(/There was an error[\s\S]*InitMe error/mg);
//   });
});
