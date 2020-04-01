describe('Emulator binary version', () => {
  const versionResult = [
    'Android emulator version 30.1.2.3 (build_id 6306047) (CL:N/A)',
    "Copyright (C) 2006-2017 The Android Open Source Project and many others.",
    "This program is a derivative of the QEMU CPU emulator (www.qemu.org).",
    "  This software is licensed under the terms of the GNU General Public",
    "  License version 2, as published by the Free Software Foundation, and",
    "  may be copied, distributed, and modified under those terms.",
    "  This program is distributed in the hope that it will be useful,",
    "  but WITHOUT ANY WARRANTY; without even the implied warranty of",
    "  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the",
    "  GNU General Public License for more details.",
  ].join('\n');
  const expectedVersion = {
    major: 30,
    minor: 1,
    patch: 2,
  };

  let emulator;
  let log;
  let emulatorVersion;
  beforeEach(() => {
    emulator = {
      queryVersion: jest.fn().mockResolvedValue(versionResult),
    };

    jest.mock('../../../utils/logger', () => ({
      child: jest.fn().mockReturnValue({
        debug: jest.fn(),
        warn: jest.fn(),
      }),
    }));
    log = require('../../../utils/logger').child();

    const EmulatorVersion = require('./EmulatorVersion');
    emulatorVersion = new EmulatorVersion(emulator);
  });

  it('should query the emulator', async () => {
    await emulatorVersion.resolve();
    expect(emulator.queryVersion).toHaveBeenCalled();
  });

  it('should extract version from common log', async () => {
    const version = await emulatorVersion.resolve();
    expect(version).toEqual(expectedVersion);
  });

  it('should return null for an empty query result', async () => {
    emulator.queryVersion.mockResolvedValue(undefined);
    const version = await emulatorVersion.resolve();
    expect(version).toEqual(null);
  });

  it('should return null for a query result that has an invalid syntax', async () => {
    emulator.queryVersion.mockResolvedValue('Android emulator version \<invalid\> (build_id 6306047) (CL:N/A)');
    const version = await emulatorVersion.resolve();
    expect(version).toEqual(null);
  });

  it('should cache the version', async () => {
    await emulatorVersion.resolve();
    const version = await emulatorVersion.resolve();

    expect(emulator.queryVersion).toHaveBeenCalledTimes(1);
    expect(version).toEqual(expectedVersion);
  });

  it('should log the version', async () => {
    await emulatorVersion.resolve();
    expect(log.debug).toHaveBeenCalledWith({event: 'EMU_BIN_VERSION_DETECT', success: true}, expect.any(String), expectedVersion);
  });

  it('should log in case of an error', async () => {
    emulator.queryVersion.mockResolvedValue('mock result');
    await emulatorVersion.resolve();
    expect(log.warn).toHaveBeenCalledWith({event: 'EMU_BIN_VERSION_DETECT', success: false}, expect.any(String), 'mock result');
  });
});
