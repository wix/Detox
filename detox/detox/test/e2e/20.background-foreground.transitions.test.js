describe(":ios: Background-Foreground Transitions", () => {
	it("Backgrounding and foregrounding an app should wait for transition to finish", async () => {
		await device.launchApp({newInstance: true});
		await device.sendToHome();
		await expect(element(by.text("Background"))).toBeVisible();
		await device.launchApp({newInstance: false});
		await expect(element(by.text("Active"))).toBeVisible();
	});
});

