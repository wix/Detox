describe(":ios: Background-Foreground Transitions", () => {
	it("Backgrounding and foregrounding an app should wait for transition to finish", async () => {
		await device.launchApp({newInstance: true});
		await device.sendToHome();
		//Cannot use toBeVisible because Earl Grey does not support apps in background
		await expect(element(by.text("Background"))).toExist();
		await device.launchApp({newInstance: false});
		await expect(element(by.text("Active"))).toBeVisible();
	});
});

