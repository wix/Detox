const validScheme = require('../schemes.mock').valid;
const noScheme = require('../schemes.mock').noScheme;
const noAppPathScheme = require('../schemes.mock').noAppPath;
const noDeviceScheme = require('../schemes.mock').noDevice;

describe('device', () => {
  let Device;
  let device;

  let argparse;

  beforeEach(() => {
    jest.mock('../utils/argparse');
    argparse = require('../utils/argparse');

    Device = require('./device');

    device = new Device("", validScheme);
  });

  it(`_detrmineCurrentScheme() - should resolve a scheme if its valid`, () => {
    const resolvedScheme = device._detrmineCurrentScheme(validScheme);
    expect(resolvedScheme).toBeDefined();
  });

  it(`_detrmineCurrentScheme() - should throw error when a nonexistent custom scheme is suppled in command line args`, () => {
    argparse.getArgValue.mockReturnValue('nonexistent');
    try {
      device._detrmineCurrentScheme(noScheme);
    } catch (ex) {
      expect(ex).toBeDefined();
    }
  });

  it(`_detrmineCurrentScheme() - should throw error when has no 'scheme'`, () => {
    try {
      device._detrmineCurrentScheme(noScheme);
    } catch (ex) {
      expect(ex).toBeDefined();
    }
  });

  it(`_detrmineCurrentScheme() - should throw error when has no 'scheme.app'`, () => {
    try {
      device._detrmineCurrentScheme(noAppPathScheme);
    } catch (ex) {
      expect(ex).toBeDefined();
    }
  });

  it(`_detrmineCurrentScheme() - should throw error when has no 'scheme.device'`, () => {
    try {
      device._detrmineCurrentScheme(noDeviceScheme);
    } catch (ex) {
      expect(ex).toBeDefined();
    }
  });
});
