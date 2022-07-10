const driver = {
  openScreen: async () => await element(by.text("Location")).tap(),
  tapOnGetLocation: async () => await element(by.id('getLocationButton')).tap(),
  errorElement: element(by.id('error')),
  latitude: {
    element: element(by.id('latitude')),
    waitUntilVisible: async () => {
      await waitFor(driver.latitude.element).toBeVisible().withTimeout(5500);
    },
    expectValue: async (latitude) => {
      await expect(driver.latitude.element).toHaveText(`Latitude: ${latitude}`);
    }
  },
  longitude: {
    element: element(by.id('longitude')),
    waitUntilVisible: async () => {
      await waitFor(driver.longitude.element).toBeVisible().withTimeout(5500);
    },
    expectValue: async (longitude) => {
      await expect(driver.longitude.element).toHaveText(`Longitude: ${longitude}`);
    }
  },
  expectLocationToBeAvailable: async () => {
    await driver.openScreen();

    const latitude = -80.125;
    const longitude = 66.5;
    await device.setLocation(latitude, longitude);

    await driver.tapOnGetLocation();

    await driver.latitude.waitUntilVisible();
    await driver.longitude.waitUntilVisible();
    await driver.latitude.expectValue(latitude);
    await driver.longitude.expectValue(longitude);
  }
};

module.exports = {
  locationScreenDriver: driver,
};
