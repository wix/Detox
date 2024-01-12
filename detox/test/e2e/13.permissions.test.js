const { RESULTS } = require('react-native-permissions');

const BASIC_PERMISSIONS_TO_CHECK = [
  'userTracking',
  'calendar',
  'camera',
  'contacts',
  'microphone',
  'reminders',
  'siri',
  'speech',
  'medialibrary'
];

const LOCATION_ALWAYS = 'location_always';
const LOCATION_WHEN_IN_USE = 'location_when_in_use';

const PHOTO_LIBRARY = 'photo_library';
const PHOTO_LIBRARY_ADD_ONLY = 'photo_library_add_only';

describe(':ios: Permissions', () => {
  BASIC_PERMISSIONS_TO_CHECK.forEach((name) => {
    describe(name, () => {
      const authorizationStatus = element(by.id(name));

      it('should find element with test-id: ' + name, async () => {
        await device.launchApp({delete: true});
        await element(by.text('Permissions')).tap();

        await expect(authorizationStatus).toBeVisible();
      });

      it('should show default permissions when undefined', async () => {
        await device.launchApp({delete: true});
        await element(by.text('Permissions')).tap();

        await expect(authorizationStatus).toHaveText(RESULTS.DENIED);
      });

      it('should show default permissions when defined to `unset`', async () => {
        const permissions = {[name]: 'unset'};

        await device.launchApp({permissions, delete: true});
        await element(by.text('Permissions')).tap();

        await expect(authorizationStatus).toHaveText(RESULTS.DENIED);
      });

      it('should grant permission', async () => {
        const permissions = {[name]: 'YES'};

        await device.launchApp({permissions, delete: true});
        await element(by.text('Permissions')).tap();

        await expect(authorizationStatus).toHaveText('granted');
      });

      it('should block permissions', async () => {
        const permissions = {[name]: 'NO'};

        await device.launchApp({permissions, delete: true});
        await element(by.text('Permissions')).tap();

        await expect(authorizationStatus).toHaveText(RESULTS.BLOCKED);
      });
    });
  });

  describe("location", () => {
    const locationAlways = element(by.id(LOCATION_ALWAYS));
    const locationInuse = element(by.id(LOCATION_WHEN_IN_USE));

    it('should find status elements', async () => {
      await device.launchApp({delete: true});
      await element(by.text('Permissions')).tap();

      await expect(locationAlways).toBeVisible();
      await expect(locationInuse).toBeVisible();
    });

    it('should show default permissions when undefined', async () => {
      await device.launchApp({delete: true});
      await element(by.text('Permissions')).tap();

      await expect(locationAlways).toHaveText(RESULTS.DENIED);
      await expect(locationInuse).toHaveText(RESULTS.DENIED);
    });

    it('should show default permissions when defined to `unset`', async () => {
      const permissions = {location: 'unset'};

      await device.launchApp({permissions, delete: true});
      await element(by.text('Permissions')).tap();

      await expect(locationAlways).toHaveText(RESULTS.DENIED);
      await expect(locationInuse).toHaveText(RESULTS.DENIED);
    });

    it('should grant permission `inuse`', async () => {
      const permissions = {location: 'inuse'};

      await device.launchApp({permissions, delete: true});
      await element(by.text('Permissions')).tap();

      await expect(locationAlways).toHaveText(RESULTS.BLOCKED);
      await expect(locationInuse).toHaveText(RESULTS.GRANTED);
    });

    it('should grant permission `always`', async () => {
      const permissions = {location: 'always'};

      await device.launchApp({permissions, delete: true});
      await element(by.text('Permissions')).tap();

      await expect(locationAlways).toHaveText(RESULTS.GRANTED);
      await expect(locationInuse).toHaveText(RESULTS.GRANTED);
    });

    it('should block permissions', async () => {
      const permissions = {location: 'never'};

      await device.launchApp({permissions, delete: true});
      await element(by.text('Permissions')).tap();

      await expect(locationAlways).toHaveText(RESULTS.BLOCKED);
      await expect(locationInuse).toHaveText(RESULTS.BLOCKED);
    });
  });

  describe("faceid", () => {
    const faceid = element(by.id('faceid'));

    it('should find status elements', async () => {
      await device.launchApp({ delete: true });
      await element(by.text('Permissions')).tap();

      await expect(faceid).toBeVisible();
    });

    it('should get unavailable status when biometrics are not enrolled', async () => {
      await device.setBiometricEnrollment(false);

      await device.launchApp({ delete: true });
      await element(by.text('Permissions')).tap();

      await expect(faceid).toHaveText(RESULTS.UNAVAILABLE);
    });

    describe("when biometrics are enrolled", () => {
      beforeEach(async () => {
        await device.setBiometricEnrollment(true);
      });

      it('should show default permissions when undefined', async () => {
        await device.launchApp({ delete: true });
        await element(by.text('Permissions')).tap();

        await expect(faceid).toHaveText(RESULTS.DENIED);
      });

      it('should show default permissions when defined to `unset`', async () => {
        const permissions = { faceid: 'unset' };

        await device.launchApp({ permissions, delete: true });
        await element(by.text('Permissions')).tap();

        await expect(faceid).toHaveText(RESULTS.DENIED);
      });

      // todo: Skipped due to an error coming from react-native-permissions. Fix or implement a custom check.
      it.skip('should grant permission', async () => {
        const permissions = { faceid: 'YES' };

        await device.launchApp({ permissions, delete: true });
        await element(by.text('Permissions')).tap();

        await expect(faceid).toHaveText('granted');
      });

      it('should block permissions', async () => {
        const permissions = { faceid: 'NO' };

        await device.launchApp({ permissions, delete: true });
        await element(by.text('Permissions')).tap();

        await expect(faceid).toHaveText(RESULTS.BLOCKED);
      });
    });
  });

  describe("photos", () => {
    const photoLibrary = element(by.id(PHOTO_LIBRARY));
    const photoLibraryAddOnly = element(by.id(PHOTO_LIBRARY_ADD_ONLY));

    it('should find status elements', async () => {
      await device.launchApp({delete: true});
      await element(by.text('Permissions')).tap();

      await expect(photoLibrary).toBeVisible();
      await expect(photoLibraryAddOnly).toBeVisible();
    });

    it('should show default permissions when undefined', async () => {
      await device.launchApp({delete: true});
      await element(by.text('Permissions')).tap();

      await expect(photoLibrary).toHaveText(RESULTS.DENIED);
      await expect(photoLibraryAddOnly).toHaveText(RESULTS.DENIED);
    });

    it('should show default permissions when defined to `unset`', async () => {
      const permissions = {photos: 'unset'};

      await device.launchApp({permissions, delete: true});
      await element(by.text('Permissions')).tap();

      await expect(photoLibrary).toHaveText(RESULTS.DENIED);
      await expect(photoLibraryAddOnly).toHaveText(RESULTS.DENIED);
    });

    it('should grant permission `limited`', async () => {
      const permissions = {photos: 'limited'};

      await device.launchApp({permissions, delete: true});
      await element(by.text('Permissions')).tap();

      await expect(photoLibrary).toHaveText(RESULTS.DENIED);
      await expect(photoLibraryAddOnly).toHaveText(RESULTS.GRANTED);
    });

    it('should grant permission', async () => {
      const permissions = {photos: 'YES'};

      await device.launchApp({permissions, delete: true});
      await element(by.text('Permissions')).tap();

      await expect(photoLibrary).toHaveText(RESULTS.GRANTED);
      await expect(photoLibraryAddOnly).toHaveText(RESULTS.GRANTED);
    });

    it('should block permissions', async () => {
      const permissions = {photos: 'NO'};

      await device.launchApp({permissions, delete: true});
      await element(by.text('Permissions')).tap();

      await expect(photoLibrary).toHaveText(RESULTS.BLOCKED);
      await expect(photoLibraryAddOnly).toHaveText(RESULTS.DENIED);
    });
  });

  it('should grant or block multiple permissions', async () => {
    const permissions = {
      photos: 'YES',
      camera: 'YES',
      location: 'never'
    };

    await device.launchApp({permissions, delete: true});
    await element(by.text('Permissions')).tap();

    await expect(element(by.id('photo_library'))).toHaveText(RESULTS.GRANTED);
    await expect(element(by.id('camera'))).toHaveText(RESULTS.GRANTED);
    await expect(element(by.id(LOCATION_ALWAYS))).toHaveText(RESULTS.BLOCKED);
  });
});

