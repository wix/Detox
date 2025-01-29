describe(":ios: Picker", () => {
    beforeEach(async () => {
      await device.reloadReactNative();
      await element(by.text("Picker")).tap();
    });

    it("picker should select value correctly", async () => {
      await element(by.id("pickerView")).setColumnToValue(0, "c");
      await expect(element(by.id("valueLabel"))).toHaveText("com.wix.detox.c");
    });
});
