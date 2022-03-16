package com.wix.detox.uiautomator;

import androidx.test.platform.app.InstrumentationRegistry;
import androidx.test.uiautomator.UiDevice;

/**
 * Created by rotemm on 30/08/2017.
 */

public class UiAutomator {
    private UiAutomator() {}

    public static UiDevice uiDevice() {
        return UiDevice.getInstance(InstrumentationRegistry.getInstrumentation());
    }
}
