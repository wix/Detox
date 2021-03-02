package com.wix.detox;

import android.os.Bundle;
import android.util.Base64;

import java.util.Arrays;
import java.util.List;

import androidx.test.platform.app.InstrumentationRegistry;

class LaunchArgs {
    private static final String DETOX_NOTIFICATION_PATH_ARG = "detoxUserNotificationDataURL";
    private static final String DETOX_URL_OVERRIDE_ARG = "detoxURLOverride";
    private static final List<String> RESERVED_INSTRUMENTATION_ARGS = Arrays.asList("class", "package", "func", "unit", "size", "perf", "debug", "log", "emma", "coverageFile");

    boolean hasNotificationPath() {
        return InstrumentationRegistry.getArguments().containsKey(DETOX_NOTIFICATION_PATH_ARG);
    }

    String getNotificationPath() {
        return InstrumentationRegistry.getArguments().getString(DETOX_NOTIFICATION_PATH_ARG);
    }

    boolean hasUrlOverride() {
        return InstrumentationRegistry.getArguments().containsKey(DETOX_URL_OVERRIDE_ARG);
    }

    String getUrlOverride() {
        return InstrumentationRegistry.getArguments().getString(DETOX_URL_OVERRIDE_ARG);
    }

    Bundle asIntentBundle() {
        final Bundle instrumentationArgs = InstrumentationRegistry.getArguments();
        final Bundle launchArgs = new Bundle();

        for (String arg : instrumentationArgs.keySet()) {
            if (!RESERVED_INSTRUMENTATION_ARGS.contains(arg)) {
                launchArgs.putString(arg, decodeLaunchArgValue(arg, instrumentationArgs));
            }
        }
        return launchArgs;
    }

    private String decodeLaunchArgValue(String arg, Bundle instrumArgs) {
        final String rawValue = instrumArgs.getString(arg);

        if (arg.startsWith("detox")) {
            return rawValue;
        }

        byte[] base64Value = Base64.decode(rawValue, Base64.DEFAULT);
        return new String(base64Value);
    }
}
