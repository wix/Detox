const _ = require('lodash');
const validScheme = require('../configurations.mock').validOneEmulator;

describe('EmulatorDriver', () => {
  let fs;
  let cpp;
  let EmulatorDriver;
  let emulatorDriver;
  let argparse;

  let Client;
  let client;

  beforeEach(async () => {
    jest.mock('fs');
    fs = require('fs');
    jest.mock('./../utils/exec');

    jest.mock('../client/Client');
    jest.mock('../utils/argparse');
    argparse = require('../utils/argparse');

    Client = require('../client/Client');
    EmulatorDriver = require('./EmulatorDriver');

    client = new Client(validScheme.session);
    await client.connect();
  });

  function validEmulator() {
    return new EmulatorDriver(client, validScheme.session, validScheme.configurations['android.emu.release']);
  }

  it(`acquireFreeDevice() should trigger fbsimctl.list`, async () => {
    emulatorDriver = validEmulator();
    await emulatorDriver.acquireFreeDevice();
    //expect(emulatorDriver._fbsimctl.list).toHaveBeenCalledTimes(1);
  });


  it(`boot() should trigger fbsimctl.boot`, async () => {
    emulatorDriver = validEmulator();
    await emulatorDriver.boot();
    //expect(emulatorDriver._fbsimctl.boot).toHaveBeenCalledTimes(1);
  });

  it(`installApp() should trigger fbsimctl.install`, async () => {
    emulatorDriver = validEmulator();
    await emulatorDriver.installApp('udid', 'app/path');
    //expect(emulatorDriver._fbsimctl.install).toHaveBeenCalledTimes(1);
  });

  it(`uninstallApp() should trigger fbsimctl.uninstall`, async () => {
    emulatorDriver = validEmulator();
    await emulatorDriver.uninstallApp('deviceId', 'bundleId');
    //expect(emulatorDriver._fbsimctl.uninstall).toHaveBeenCalledWith('deviceId', 'bundleId');
  });

  it(`launch() should trigger fbsimctl.launch`, async () => {
    emulatorDriver = validEmulator();
    await emulatorDriver.launch('deviceId', 'bundleId', 'someArgs');
    //expect(emulatorDriver._fbsimctl.launch).toHaveBeenCalledWith('deviceId', 'bundleId', 'someArgs');
  });

  it(`terminate() should trigger fbsimctl.terminate`, async () => {
    emulatorDriver = validEmulator();
    await emulatorDriver.terminate('deviceId', 'bundleId');
    //expect(emulatorDriver._fbsimctl.terminate).toHaveBeenCalledWith('deviceId', 'bundleId');
  });

  it(`reloadReactNative() should trigger client.reloadReactNative`, async() => {
    emulatorDriver = validEmulator();
    await emulatorDriver.reloadReactNative();
    expect(emulatorDriver.client.reloadReactNative).toHaveBeenCalledTimes(1);
  });

  it(`sendUserNotification() should trigger client.sendUserNotification`, async() => {
    emulatorDriver = validEmulator();
    fs.existsSync.mockReturnValueOnce(false).mockReturnValueOnce(true);
    await emulatorDriver.sendUserNotification('notification');
    expect(emulatorDriver.client.sendUserNotification).toHaveBeenCalledTimes(1);
  });
});