const LOCATION_SCREEN_BUTTON_TEXT = 'Location';
const LOCATION_LATITUDE_TEST_ID = 'location_latitude';
const LOCATION_LONGITUDE_TEST_ID = 'location_longitude';
const LOCATION_ERROR_TEST_ID = 'location_error';
const GET_LOCATION_BUTTON_TEST_ID = 'get_location_button';

const DUMMY_COORDINATE_1 = -80.125;
const DUMMY_COORDINATE_2 = 66.5;

describe('set location', () => {
  const enterLocationScreen = async (location) => {
    await device.launchApp({
      delete: true,
      ...(location !== undefined && { permissions: { location: location } }),
    });

    await element(by.text(LOCATION_SCREEN_BUTTON_TEXT)).tap();
  }

  const updateLocationInfo = async () => {
    await element(by.id(GET_LOCATION_BUTTON_TEST_ID)).tap();
  }

  const expectLocationToAppear = async (latitude, longitude) => {
    await waitFor(element(by.id(LOCATION_LATITUDE_TEST_ID))).toHaveText(`Latitude: ${latitude}`).withTimeout(5000);
    await expect(element(by.id(LOCATION_LONGITUDE_TEST_ID))).toHaveText(`Longitude: ${longitude}`);
  }

  const expectErrorToAppear = async () => {
    await waitFor(element(by.id(LOCATION_ERROR_TEST_ID))).toBeVisible().withTimeout(3000);
    await expect(element(by.id(LOCATION_LATITUDE_TEST_ID))).not.toBeVisible();
    await expect(element(by.id(LOCATION_LONGITUDE_TEST_ID))).not.toBeVisible();
  }

  describe(':android: permission granted in the app manifest', () => {
    it('should set location', async () => {
      await enterLocationScreen();

      await device.setLocation(DUMMY_COORDINATE_1, DUMMY_COORDINATE_2);
      await updateLocationInfo();

      await expectLocationToAppear(DUMMY_COORDINATE_1, DUMMY_COORDINATE_2);
    });

    it('should set location multiple times', async () => {
      await enterLocationScreen();

      await device.setLocation(DUMMY_COORDINATE_1, DUMMY_COORDINATE_2);
      await device.setLocation(DUMMY_COORDINATE_2, DUMMY_COORDINATE_1);
      await updateLocationInfo();

      await expectLocationToAppear(DUMMY_COORDINATE_2, DUMMY_COORDINATE_1);
    });
  });

  describe(':ios: permission set on launch config', () => {
    it('should show error when permission defined as `never`', async () => {
      await enterLocationScreen('never');
      await updateLocationInfo();
      await expectErrorToAppear();
    });

    it('should set location when permission defined as `inuse`', async () => {
      await enterLocationScreen('inuse');

      await device.setLocation(DUMMY_COORDINATE_1, DUMMY_COORDINATE_2);
      await updateLocationInfo();

      await expectLocationToAppear(DUMMY_COORDINATE_1, DUMMY_COORDINATE_2);
    });

    it('should set location when permission defined as `always`', async () => {
      await enterLocationScreen('always');

      await device.setLocation(DUMMY_COORDINATE_1, DUMMY_COORDINATE_2);
      await updateLocationInfo();

      await expectLocationToAppear(DUMMY_COORDINATE_1, DUMMY_COORDINATE_2);
    });

    it('should set location multiple times', async () => {
      await enterLocationScreen('always');

      await device.setLocation(DUMMY_COORDINATE_1, DUMMY_COORDINATE_2);
      await device.setLocation(DUMMY_COORDINATE_2, DUMMY_COORDINATE_1);
      await updateLocationInfo();

      await expectLocationToAppear(DUMMY_COORDINATE_2, DUMMY_COORDINATE_1);
    });
  });
});
