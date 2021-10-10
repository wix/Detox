declare var describe: (test: string, callback: () => void) => void;
declare var beforeAll: (callback: () => void) => void;
declare var afterAll: (callback: () => void) => void;
declare var test: (test: string, callback: () => void) => void;

describe("Test", () => {
    beforeAll(async () => {
        await device.appLaunchArgs.modify({ ourMockServerPort: 9999 }, { permanent: true });
        await device.selectApp('app1');
        await device.appLaunchArgs.modify({ appMockServerPort: 4000 });
        await device.appLaunchArgs.get({ permanent: true }); // {  ourMockServerPort: 9999 }

        await device.selectApp('app2');
        await device.appLaunchArgs.modify({ appMockServerPort: 4001 });
        await device.appLaunchArgs.get(); // { appMockServerPort: 4001, ourMockServerPort: 9999 }
    });

    beforeAll(async () => {
        await device.reloadReactNative();
        await device.takeScreenshot("test screenshot");
    });

    afterAll(async () => {
        await device.appLaunchArgs.reset();
        await device.appLaunchArgs.reset({ permanent: true });
    });

    afterAll(async () => {
        await element(by.id("element")).clearText();
    });

    test("Test", async () => {
        await element(by.id("element")).replaceText("text");
        await element(by.id("element")).tap();
        await element(by.id("element")).longPress();
        await element(by.id("element")).longPress(1000);
        await element(by.id("element")).scroll(50, "down");
        await element(by.id("scrollView")).scrollTo("bottom");
        await expect(element(by.id("element")).atIndex(0)).toNotExist();
        await element(by.id("scrollView")).swipe("down", "fast", 0.2, 0.5, 0.5);
        await element(by.type("UIPickerView")).setColumnToValue(1, "6");

        await expect(
            element(by.id("element").withAncestor(by.id("parent_element")))
        ).toNotExist();
        await expect(
            element(by.id("element").withDescendant(by.id("child_element")))
        ).toNotExist();

        const expectElement = expect(element(by.id('TextField_Id1')));

        await expectElement.toBeVisible();
        await expectElement.not.toBeVisible();
        await expectElement.toBeNotVisible();

        await expectElement.toBeFocused();
        await expectElement.not.toBeFocused();
        await expectElement.toBeNotFocused();

        const waitForElement = waitFor(element(by.id("element")));
        await waitForElement.toBeVisible().withTimeout(2000);

        await device.pressBack();
        await device.reverseTcpPort(32167);
        await device.unreverseTcpPort(32167);

        await waitFor(element(by.text("Text5")))
            .toBeVisible()
            .whileElement(by.id("ScrollView630"))
            .scroll(50, "down");

        await web.element(by.web.id("btnSave")).tap();
        await web.element(by.web.className("scroll-end")).atIndex(0).scrollToView();

        const webview = web(by.id("webview"));
        await expect(webview.element(by.web.cssSelector(".button"))).toExist();
        await expect(webview.element(by.web.cssSelector(".button")).atIndex(1)).toExist();
    });
});
