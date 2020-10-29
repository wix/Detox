const rootId = 'View7990';

const driver = {
  tapsElement: {
    testId: 'UniqueId819',
    get coordinates() {
      return {
        x: (device.getPlatform() === 'ios' ? 180 : 100),
        y: 100,
      };
    },
    multiTap: () => element(by.id(driver.tapsElement.testId)).multiTap(3),
    tapAtPoint: () => element(by.id(rootId)).tapAtPoint(driver.tapsElement.coordinates),
    assertTapsCount: (count) => expect(element(by.id(driver.tapsElement.testId))).toHaveText(`Taps: ${count}`),
    assertTappedOnce: () => driver.tapsElement.assertTapsCount(1),
    assertMultiTapped: () => driver.tapsElement.assertTapsCount(3),
  },

  doubleTapsElement: {
    testId: 'doubleTappableText',
    coordinates: { x: 180, y: 100 },
    tapOnce: () => element(by.id(driver.doubleTapsElement.testId)).tap(),
    tapTwice: async () => {
      await driver.doubleTapsElement.tapOnce();
      await driver.doubleTapsElement.tapOnce();
    },
    multiTapOnce: () => element(by.id(driver.doubleTapsElement.testId)).multiTap(1),
    doubleTap: () => element(by.id(driver.doubleTapsElement.testId)).multiTap(2),
    tapAtPointOnce: () => element(by.id(rootId)).tapAtPoint(driver.doubleTapsElement.coordinates),
    tapAtPointTwice: async () => {
      await driver.doubleTapsElement.tapAtPointOnce();
      await driver.doubleTapsElement.tapAtPointOnce();
    },
    assertTapsCount: (count) => expect(element(by.id(driver.doubleTapsElement.testId))).toHaveText(`Double-Taps: ${count}`),
    assertNoTaps: () => driver.doubleTapsElement.assertTapsCount(0),
  },

  sluggishTapElement: {
    testId: 'sluggishTappableText',
    tap: () => element(by.id(driver.sluggishTapElement.testId)).tap()
  }
};

module.exports = {
  actionsScreenDriver: driver,
};
