const DUMMY_COORDINATE1_LONGITUDE = '66.5';
const DUMMY_COORDINATE1_LATITUDE = '-80.125';
const DUMMY_COORDINATE2_LONGITUDE = '-80.125';
const DUMMY_COORDINATE2_LATITUDE = '66.5';

describe.forCopilot('Location', () => {
  beforeEach(async () => {
    await copilot.perform(
      'Restart the React Native state',
      'Navigate to the Location screen'
    );
  });

  describe('Location Tests', () => {
    it('should show error when permission defined as `never`', async () => {
      await copilot.perform(
        'Launch the app with location permission denied',
        'Verify there is an element with the text "Get location"',
        'Tap the get location element',
        'Verify there is an element with the text "User denied access to location services."'
      );
    });

    it('should show location when permission is `always`', async () => {
      await copilot.perform(
        'Launch the app with location permission always',
        'Verify there is an element with the text "Get location"',
        'Tap the get location element',
        `Set the device location (${DUMMY_COORDINATE1_LATITUDE}, ${DUMMY_COORDINATE1_LONGITUDE})`,
        `Verify that "Latitude: ${DUMMY_COORDINATE1_LATITUDE}" is displayed`,
        `Verify that "Longitude: ${DUMMY_COORDINATE1_LONGITUDE}" is displayed`
      );
    });

    it('should show location when permission is `inuse`', async () => {
      await copilot.perform(
        'Launch the app with location permission just once',
        'Verify there is an element with the text "Get location"',
        'Tap the get location element',
        `Set the device location to (${DUMMY_COORDINATE1_LATITUDE}, ${DUMMY_COORDINATE1_LONGITUDE})`,
        `Verify that "Latitude: ${DUMMY_COORDINATE1_LATITUDE}" is displayed`,
        `Verify that "Longitude: ${DUMMY_COORDINATE1_LONGITUDE}" is displayed`
      );
    });

    it('should set location multiple times', async () => {
      await copilot.perform(
        'Launch the app with location permission just once',
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
