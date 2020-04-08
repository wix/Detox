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

  let MockQueryVersionCommand;
  let emulatorExec;
  let log;
  let uut;
  beforeEach(() => {
    MockQueryVersionCommand = jest.genMockFromModule('../tools/EmulatorExec').QueryVersionCommand;
    jest.mock('../tools/EmulatorExec', () => ({
      QueryVersionCommand: MockQueryVersionCommand,
    }));

    emulatorExec = {
      exec: jest.fn().mockResolvedValue(versionResult),
    };

    jest.mock('../../../../utils/logger', () => ({
      child: jest.fn().mockReturnValue({
        debug: jest.fn(),
        warn: jest.fn(),
      }),
    }));
    log = require('../../../../utils/logger').child();

    const EmulatorVersionResolver = require('./EmulatorVersionResolver');
    uut = new EmulatorVersionResolver(emulatorExec);
  });

  it('should query the emulator', async () => {
    await uut.resolve();
    expect(emulatorExec.exec).toHaveBeenCalledWith(expect.any(MockQueryVersionCommand));
  });

  it('should extract version from common log', async () => {
    const version = await uut.resolve();
    expect(version).toEqual(expectedVersion);
  });

  it('should return null for an empty query result', async () => {
    emulatorExec.exec.mockResolvedValue(undefined);
    const version = await uut.resolve();
    expect(version).toEqual(null);
  });

  it('should return null for a query result that has an invalid syntax', async () => {
    emulatorExec.exec.mockResolvedValue('Android emulator version \<invalid\> (build_id 6306047) (CL:N/A)');
    const version = await uut.resolve();
    expect(version).toEqual(null);
  });

  it('should cache the version', async () => {
    await uut.resolve();
    const version = await uut.resolve();

    expect(emulatorExec.exec).toHaveBeenCalledTimes(1);
    expect(version).toEqual(expectedVersion);
  });

  it('should log the version', async () => {
    await uut.resolve();
    expect(log.debug).toHaveBeenCalledWith({event: 'EMU_BIN_VERSION_DETECT', success: true}, expect.any(String), expectedVersion);
  });

  it('should log in case of an error', async () => {
    emulatorExec.exec.mockResolvedValue('mock result');
    await uut.resolve();
    expect(log.warn).toHaveBeenCalledWith({event: 'EMU_BIN_VERSION_DETECT', success: false}, expect.any(String), 'mock result');
  });
});
