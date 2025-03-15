const DUMMY_COORDINATE1_LONGITUDE = '66.5';
const DUMMY_COORDINATE1_LATITUDE = '-80.125';
const DUMMY_COORDINATE2_LONGITUDE = '-80.125';
const DUMMY_COORDINATE2_LATITUDE = '66.5';

describe.forPilot('Location', () => {
  beforeEach(async () => {
    await pilot.perform(
      'Restart the React Native state',
    );
  });

  describe('Location Tests', () => {
    it('should show error when permission defined as `never`', async () => {
      await pilot.perform(
        'Launch the app with location permission denied',
        'Navigate to the Location screen',
        'Verify there is an element with the text "Get location"',
        'Tap the get location element',
        'Verify there is an element with the text "User denied access to location services."'
      );
    });

    it('should show location when permission is `always`', async () => {
      await pilot.perform(
        'Launch the app with location permission always',
        'Navigate to the Location screen',
        'Verify there is an element with the text "Get location"',
        'Tap the get location element',
        `Set the device location (${DUMMY_COORDINATE1_LATITUDE}, ${DUMMY_COORDINATE1_LONGITUDE})`,
        `Verify that "Latitude: ${DUMMY_COORDINATE1_LATITUDE}" is displayed`,
        `Verify that "Longitude: ${DUMMY_COORDINATE1_LONGITUDE}" is displayed`
      );
    });

    it('should show location when permission is `inuse`', async () => {
      await pilot.perform(
        'Launch the app with location permission just once',
        'Navigate to the Location screen',
        'Verify there is an element with the text "Get location"',
        'Tap the get location element',
        `Set the device location to (${DUMMY_COORDINATE1_LATITUDE}, ${DUMMY_COORDINATE1_LONGITUDE})`,
        `Verify that "Latitude: ${DUMMY_COORDINATE1_LATITUDE}" is displayed`,
        `Verify that "Longitude: ${DUMMY_COORDINATE1_LONGITUDE}" is displayed`
      );
    });

    it('should set location multiple times', async () => {
      await pilot.perform(
        'Launch the app with location permission just once',
        'Navigate to the Location screen',
        'Verify there is an element with the text "Get location"',
        'Tap the get location element',
        `Set the device location to (${DUMMY_COORDINATE1_LATITUDE}, ${DUMMY_COORDINATE1_LONGITUDE})`,
        `Set the device location to (${DUMMY_COORDINATE2_LATITUDE}, ${DUMMY_COORDINATE2_LONGITUDE})`,
        `Verify that "Latitude: ${DUMMY_COORDINATE2_LATITUDE}" is displayed`,
        `Verify that "Longitude: ${DUMMY_COORDINATE1_LONGITUDE}" is displayed`
      );
    });
  });
});
