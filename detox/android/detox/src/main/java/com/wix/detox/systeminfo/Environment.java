package com.wix.detox.systeminfo;

import android.os.Build;

public class Environment {
    public static final String EMULATOR_LOCALHOST = "ws://10.0.2.2:8099";
    public static final String GENYMOTION_LOCALHOST = "ws://10.0.3.2:8099";
    public static final String DEVICE_LOCALHOST = "ws://localhost:8099";

    private static boolean isRunningOnGenymotion() {
        return Build.FINGERPRINT.contains("vbox");
    }

    private static boolean isRunningOnStockEmulator() {
        return Build.FINGERPRINT.contains("generic");
    }

    public static String getServerHost() {
        // Since genymotion runs in vbox it use different hostname to refer to adb host.
        // We detect whether app runs on genymotion and replace js bundle server hostname accordingly

        if (isRunningOnGenymotion()) {
            return GENYMOTION_LOCALHOST;
        }

        if (isRunningOnStockEmulator()) {
            return EMULATOR_LOCALHOST;
        }

        return DEVICE_LOCALHOST;
    }
}