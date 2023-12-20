const { urlDriver } = require('./drivers/url-driver');
const DetoxConstants = require('detox').DetoxConstants;

describe(':ios: User Activity', () => {
  it('Init from browsing web', async () => {
    // await device.__debug_sleep(10000);
    await device.launchApp({newInstance: true, userActivity: userActivityBrowsingWeb});
    await urlDriver.navToUrlScreen();
    await urlDriver.assertUrl('https://my.deeplink.dtx');
  });

  it('Background searchable item', async () => {
    await device.launchApp({newInstance: true});
    await urlDriver.navToUrlScreen();
    await device.sendToHome();
    await device.launchApp({newInstance: false, userActivity: userActivitySearchableItem});
    await urlDriver.assertUrl('com.test.itemId');
  });

  it('Foreground browsing web', async () => {
    await device.launchApp({newInstance: true});
    await urlDriver.navToUrlScreen();
    await device.sendUserActivity(userActivityBrowsingWeb);
    await urlDriver.assertUrl('https://my.deeplink.dtx');
  });
});

const userActivityBrowsingWeb = {
  "activityType": DetoxConstants.userActivityTypes.browsingWeb,
  "webpageURL": "https://my.deeplink.dtx",
  "referrerURL": "https://google.com/"
};

const userActivitySearchableItem = {
  "activityType": DetoxConstants.userActivityTypes.searchableItem,
  "userInfo": {}
};
userActivitySearchableItem.userInfo[DetoxConstants.searchableItemActivityIdentifier] = "com.test.itemId"
