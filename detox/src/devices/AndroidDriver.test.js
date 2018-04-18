describe("AndroidDriver", () => {
	let mockClient;
	let driver;
	let ADB;

	beforeEach(() => {
		jest.mock("npmlog");

		jest.mock("./android/ADB");
		ADB = require("./android/ADB");

		const AndroidDriver = require("./AndroidDriver");

		driver = new AndroidDriver(jest.fn());
	});

	it("getInstrumentationRunner", async () => {
		const adbShellPmListInstrumentationOutput =
			"instrumentation:com.android.emulator.smoketests/android.support.test.runner.AndroidJUnitRunner (target=com.android.emulator.smoketests)\n" +
			"instrumentation:com.android.smoketest.tests/com.android.smoketest.SmokeTestRunner (target=com.android.smoketest)\n" +
			"instrumentation:com.example.android.apis/.app.LocalSampleInstrumentation (target=com.example.android.apis)\n" +
			"instrumentation:org.chromium.webview_shell/.WebViewLayoutTestRunner (target=org.chromium.webview_shell)\n";

		const adbMockInstance = ADB.mock.instances[0];
		adbMockInstance.listInstrumentation.mockReturnValue(
			Promise.resolve(adbShellPmListInstrumentationOutput)
		);

		const result = await driver.getInstrumentationRunner(
			"deviceId",
			"com.example.android.apis"
		);
		expect(result).toEqual(
			"com.example.android.apis/.app.LocalSampleInstrumentation"
		);
	});
});
