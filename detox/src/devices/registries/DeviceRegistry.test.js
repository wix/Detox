const _ = require('lodash');
const TestDeviceRegistry = require('./__mocks__/TestDeviceRegistry');
const TestDeviceRegistryLock = require('./__mocks__/DeviceRegistryLock');

describe('DeviceRegistry', () => {
  let fakeDeviceList;
  let deviceRegistry;
  let deviceRegistryLock;
  let createDeviceWithProperties;
  let getDevicesWithProperties;

  beforeEach(() => {
    fakeDeviceList = [];
    deviceRegistryLock = new TestDeviceRegistryLock();
    createDeviceWithProperties = jest.fn().mockImplementation((properties) => {
      const udid = `createdDevice_${createDeviceWithProperties.mock.calls.length}`;
      fakeDeviceList.push({ ...properties, udid });
      return udid;
    });

    getDevicesWithProperties = jest.fn().mockImplementation((properties) => {
      return _.filter(fakeDeviceList, properties);
    });

    deviceRegistry = new TestDeviceRegistry({
      deviceRegistryLock,
      createDeviceWithProperties,
      getDevicesWithProperties,
      getRuntimeVersion: ({ version }) => Number(version),
    });
  });

  function aDevice(udid, name, type, version) {
    return { udid, name, type, version };
  }

  async function acquireDevice(name) {
    return deviceRegistry.acquireDevice({ name });
  }

  it('should have a real device registry lock implementation by default', async () => {
    const registry = new TestDeviceRegistry();
    await registry.freeDevice('1');
  });

  describe(`acquireDevice`, () => {
    describe('if there are no devices with given name', () => {
      beforeEach(() => {
        fakeDeviceList.push(aDevice('1', 'DETOX', 'iPhone X', '11.4'))
      });

      it('should throw if device with given name is not found', async () => {
        await expect(acquireDevice('iPhone X')).rejects.toThrowErrorMatchingSnapshot();
      });

      it('should always unlock the registry, even after the exception', async () => {
        await expect(acquireDevice('iPhone X')).rejects.toThrow();

        expect(deviceRegistryLock.lock).toHaveBeenCalled();
        expect(deviceRegistryLock.unlock).toHaveBeenCalled();
      });
    });

    describe('if there is a device with given name', () => {
      beforeEach(() => {
        fakeDeviceList.push(aDevice('1', 'Kuche', 'iPhone X', '11.4'));
        fakeDeviceList.push(aDevice('2', 'Dog',   'iPhone X', '11.4'));
      });

      it('should return its id', async () => {
        expect(await acquireDevice('Kuche')).toBe('1');
        expect(getDevicesWithProperties).toHaveBeenCalledWith({
          name: 'Kuche',
        });
      });

      describe('but it is already busy', () => {
        beforeEach(async () => {
          await acquireDevice('Kuche');
        });

        it('should take a similar available device', async () => {
          expect(await acquireDevice('Kuche')).toBe('2');
          expect(getDevicesWithProperties).toHaveBeenCalledWith({
            type: 'iPhone X',
            version: '11.4',
          });
        });

        describe('and there are no similar devices', () => {
          beforeEach(async () => {
            await acquireDevice('Dog');
          });

          it('should create a similar device', async () => {
            expect(await acquireDevice('Kuche')).toBe('createdDevice_1');

            expect(createDeviceWithProperties).toHaveBeenCalledWith({
              name: 'Kuche-Detox',
              type: 'iPhone X',
              version: '11.4',
            });
          });
        });
      });
    });

    describe('if there are two devices with given name, but with different versions', () => {
      beforeEach(() => {
        fakeDeviceList.push(aDevice('1', 'iPhone X', 'iPhone X', '11.3'));
        fakeDeviceList.push(aDevice('2', 'iPhone X', 'iPhone X', '11.4'));
      });

      it('should take the latest one', async () => {
        expect(await acquireDevice('iPhone X')).toBe('2');
      });

      describe('when it is requested for the second time', () => {
        beforeEach(async () => await acquireDevice('iPhone X'));

        it('should create a new device with the latest version (because a free existing one has an older version)', async () => {
          const secondDeviceId = await acquireDevice('iPhone X');

          expect(secondDeviceId).toBe('createdDevice_1');
          expect(createDeviceWithProperties).toHaveBeenCalledWith({
            name: 'iPhone X-Detox',
            type: 'iPhone X',
            version: '11.4',
          });
        });
      });
    });
  });

  describe('.freeDevice', () => {
    beforeEach(() => {
      fakeDeviceList.push(aDevice('1', 'DETOX', 'iPhone X', '11.4'));
    });

    it('should free device', async () => {
      expect(await acquireDevice('DETOX')).toBe('1');
      await deviceRegistry.freeDevice('1');
      expect(await acquireDevice('DETOX')).toBe('1');
    });

    it('should not throw if called against a free device', async () => {
      await deviceRegistry.freeDevice('1');
    });
  });
});