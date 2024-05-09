declare var describe: (test: string, callback: () => void) => void;
declare var beforeAll: (callback: () => void) => void;
declare var beforeEach: (callback: () => void) => void;
declare var afterAll: (callback: () => void) => void;
declare var test: (test: string, callback: () => void) => void;

function assertType<T>(value: T) { return value; }

describe("Test", () => {
    beforeAll(async () => {
        device.appLaunchArgs.shared.modify({ ourMockServerPort: 9999 });
        await device.selectApp('app1');
        device.appLaunchArgs.shared.get(); // { ourMockServerPort: 9999 }
        await device.selectApp('app2');
        device.appLaunchArgs.modify({ appMockServerPort: 4001 });
        device.appLaunchArgs.get(); // { appMockServerPort: 4001, ourMockServerPort: 9999 }
    });

    beforeAll(async () => {
        await device.reloadReactNative();

        await device.setStatusBar({ time: "12:34" });
        await device.setStatusBar({
            time: "12:34",
            dataNetwork: "wifi",
            wifiMode: "failed",
            wifiBars: "2",
            cellularMode: "searching",
            cellularBars: "3",
            operatorName: "A1",
            batteryState: "charging",
            batteryLevel: "50",
        });

        const artifactsPaths: string[] = [
            await device.takeScreenshot("test screenshot"),
            await device.captureViewHierarchy(),
            await device.captureViewHierarchy('a'),
        ];

        artifactsPaths.splice(0);
    });

    afterAll(async () => {
        device.appLaunchArgs.reset();
        device.appLaunchArgs.shared.reset();
    });

    afterAll(async () => {
        await element(by.id("element")).clearText();
    });

    test("Test", async () => {
        await element(by.id("element")).replaceText("text");
        await element(by.id("element")).tap();
        await element(by.id("element")).tap({ x: 20, y: 30 });
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

        // eslint-disable-next-line jest/valid-expect
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

        await waitFor(element(by.text("Text5")))
          .toBeVisible()
          .whileElement(by.id("ScrollView630"))
          .scroll(50, "down", 0.5, 0.5);

        // @ts-expect-error
        await waitFor(element(by.text("Text5"))).toBeVisible().whileElement(by.id("ScrollView630")).tap();

        await web.element(by.web.id("btnSave")).tap();
        await web.element(by.web.id("btnSave")).runScript('(el) => el.click()');
        const scriptResult = await web.element(by.web.id("btnSave")).runScript(function (el: any, text: string) {
          el.textContent = text;
          return text.length;
        }, ['new button text']);
        assertType<number>(scriptResult);
        await web.element(by.web.className("scroll-end")).atIndex(0).scrollToView();

        const webview = web(by.id("webview"));
        await expect(webview.element(by.web.cssSelector(".button"))).toExist();
        await expect(webview.element(by.web.cssSelector(".button")).atIndex(1)).toExist();
    });

    describe('getAttributes', async () => {
        let commonAttributes: Detox.IosElementAttributes | Detox.AndroidElementAttributes;
        let iosAttributes: Omit<Detox.IosElementAttributes, keyof Detox.AndroidElementAttributes>;
        let androidAttributes: Omit<Detox.AndroidElementAttributes, keyof Detox.IosElementAttributes>;

        beforeEach(async () => {
            const attributes = await element(by.id("element")).getAttributes();

            if ('elements' in attributes) {
                if ('activationPoint' in attributes.elements[0]) {
                    commonAttributes = iosAttributes = attributes.elements[0] as Detox.IosElementAttributes;
                } else {
                    commonAttributes = androidAttributes = attributes.elements[0] as Detox.AndroidElementAttributes;
                }
            } else if ('activationPoint' in attributes) {
                commonAttributes = iosAttributes = attributes as Detox.IosElementAttributes;
            } else {
                commonAttributes = androidAttributes = attributes as Detox.AndroidElementAttributes;
            }
        });

        test('common attributes', () => {
            assertType<boolean>(commonAttributes.enabled);
            assertType<string>(commonAttributes.identifier);
            assertType<boolean>(commonAttributes.visible);
            assertType<string | undefined>(commonAttributes.text);
            assertType<string | undefined>(commonAttributes.label);
            assertType<string | undefined>(commonAttributes.placeholder);
            assertType<unknown>(commonAttributes.value);
            assertType<number>(commonAttributes.frame.x);
            assertType<number>(commonAttributes.frame.y);
            assertType<number>(commonAttributes.frame.width);
            assertType<number>(commonAttributes.frame.height);
        });

        test('iOS-specific attributes', () => {
            assertType<number>(iosAttributes.activationPoint.x);
            assertType<number>(iosAttributes.activationPoint.y);
            assertType<number>(iosAttributes.normalizedActivationPoint.x);
            assertType<number>(iosAttributes.normalizedActivationPoint.y);
            assertType<boolean>(iosAttributes.hittable);
            assertType<number>(iosAttributes.elementFrame.x);
            assertType<number>(iosAttributes.elementFrame.y);
            assertType<number>(iosAttributes.elementFrame.width);
            assertType<number>(iosAttributes.elementFrame.height);
            assertType<number>(iosAttributes.elementBounds.x);
            assertType<number>(iosAttributes.elementBounds.y);
            assertType<number>(iosAttributes.elementBounds.width);
            assertType<number>(iosAttributes.elementBounds.height);
            assertType<number>(iosAttributes.safeAreaInsets.top);
            assertType<number>(iosAttributes.safeAreaInsets.left);
            assertType<number>(iosAttributes.safeAreaInsets.right);
            assertType<number>(iosAttributes.safeAreaInsets.bottom);
            assertType<number>(iosAttributes.elementSafeBounds.x);
            assertType<number>(iosAttributes.elementSafeBounds.y);
            assertType<number>(iosAttributes.elementSafeBounds.width);
            assertType<number>(iosAttributes.elementSafeBounds.height);
            assertType<string | undefined>(iosAttributes.date);
            assertType<number | undefined>(iosAttributes.normalizedSliderPosition);
            if (iosAttributes.contentOffset) {
                assertType<number>(iosAttributes.contentOffset.x);
                assertType<number>(iosAttributes.contentOffset.y);
            }
            if (iosAttributes.contentInset) {
                assertType<number>(iosAttributes.contentInset.bottom);
                assertType<number>(iosAttributes.contentInset.left);
                assertType<number>(iosAttributes.contentInset.right);
                assertType<number>(iosAttributes.contentInset.top);
            }
            if (iosAttributes.adjustedContentInset) {
                assertType<number>(iosAttributes.adjustedContentInset.bottom);
                assertType<number>(iosAttributes.adjustedContentInset.left);
                assertType<number>(iosAttributes.adjustedContentInset.right);
                assertType<number>(iosAttributes.adjustedContentInset.top);
            }
            assertType<string>(iosAttributes.layer);
        });

        test('Android-specific attributes', () => {
            assertType<'visible' | 'invisible' | 'gone'>(androidAttributes.visibility);
            assertType<number>(androidAttributes.width);
            assertType<number>(androidAttributes.height);
            assertType<number>(androidAttributes.elevation);
            assertType<number>(androidAttributes.alpha);
            assertType<boolean>(androidAttributes.focused);
            assertType<number | undefined>(androidAttributes.textSize);
            assertType<number | undefined>(androidAttributes.length);
        });
    });
});
