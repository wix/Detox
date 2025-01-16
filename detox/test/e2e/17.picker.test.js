// todo(new-arch): tests are failing
//         Test Failed: View “<RNCPickerComponentView: 0x10773a5c0>” is not an instance of “UIPickerView”

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
