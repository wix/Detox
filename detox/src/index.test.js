const schemes = require('./configurations.mock');

jest.mock('./utils/logger');
jest.mock('./configuration');
jest.mock('./Detox');
jest.mock('./utils/MissingDetox');

describe('index', () => {
  let logger;
  let configuration;
  let Detox;
  let detox;
  let index;

  beforeEach(() => {
    logger = require('./utils/logger');
    configuration = require('./configuration');

    Detox = require('./Detox');

    const MissingDetox = require('./utils/MissingDetox');
    Detox.none = new MissingDetox();

    index = require('./index');
  });

  it(`should touch globals if behaviorConfig.init.exposeGlobals = true`, async () => {
    configuration.composeDetoxConfig.mockReturnValue(Promise.resolve({
      behaviorConfig: {
        init: { exposeGlobals: true }
      }
    }));

    await index.init();

    expect(Detox.none.initContext).toHaveBeenCalledWith(global);
  });

  it(`should not touch globals if behaviorConfig.init.exposeGlobals = false`, async () => {
    configuration.composeDetoxConfig.mockReturnValue(Promise.resolve({
      behaviorConfig: {
        init: { exposeGlobals: false }
      }
    }));

    await index.init();
    expect(Detox.none.initContext).not.toHaveBeenCalled();
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
//     expect(detox()[method]).toHaveBeenCalledWith(...args);
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
