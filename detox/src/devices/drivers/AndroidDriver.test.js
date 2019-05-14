describe('Android driver', () => {

  const deviceId = 'device-id-mock';
  const bundleId = 'bundle-id-mock';

  let exec;
  beforeEach(() => {
    jest.mock('nodejs-base64', () => ({
      base64encode: (x) => `base64(${x})`,
    }));
    jest.mock('../android/ADB', () => mockADBClass);
    jest.mock('../../utils/AsyncEmitter', () => mockAsyncEmitter);
    jest.mock('../../utils/sleep', () => jest.fn().mockResolvedValue(''));
    jest.mock('../../utils/retry', () => jest.fn().mockResolvedValue(''));

    jest.mock('../../utils/exec', () => ({
      spawnAndLog: jest.fn().mockReturnValue({
        childProcess: {
          on: jest.fn(),
        }
      }),
    }));
    exec = require('../../utils/exec');
  });

  let uut;
  beforeEach(() => {
    const AndroidDriver = require('./AndroidDriver');
    uut = new AndroidDriver({
      client: {}
    });
  });

  describe('launch args', () => {
    const expectSpawnedFlag = (spawnedFlags) => ({
      startingIndex: (index) => ({
        toBe: ({key, value}) => {
          expect(spawnedFlags[index]).toEqual('-e');
          expect(spawnedFlags[index + 1]).toEqual(key);
          expect(spawnedFlags[index + 2]).toEqual(value);
        }
      }),
    });

    it('should base64-encode and stringify arg values', async () => {
      const launchArgs = {
        'object-arg': {
          such: 'wow',
          much: 'amaze',
          very: 111,
        },
        'string-arg': 'text, with commas-and-dashes,',
      };

      await uut.launchApp(deviceId, bundleId, launchArgs, '');

      const spawnArgs = exec.spawnAndLog.mock.calls[0];
      const spawnedFlags = spawnArgs[1];

      expectSpawnedFlag(spawnedFlags).startingIndex(7).toBe({
        key: 'object-arg',
        value: 'base64({"such":"wow","much":"amaze","very":111})'
      });
      expectSpawnedFlag(spawnedFlags).startingIndex(10).toBe({
        key: 'string-arg',
        value: 'base64(text, with commas-and-dashes,)'
      });
    });
  });
});

class mockADBClass {
  constructor() {
    this.getInstrumentationRunner = jest.fn();
  }
}

class mockAsyncEmitter {
  constructor() {
    this.emit = jest.fn();
  }
}
