package com.wix.detox;

import android.os.Bundle;
import android.util.Base64;

import java.util.Arrays;
import java.util.List;

import androidx.test.platform.app.InstrumentationRegistry;

public class LaunchArgs {
    private static final String DETOX_SERVER_URL_ARG = "detoxServer";
    private static final String DETOX_SESSION_ID_ARG_KEY = "detoxSessionId";
    private static final String DETOX_NOTIFICATION_PATH_ARG = "detoxUserNotificationDataURL";
    private static final String DETOX_BLACKLIST_URLS_ARG = "detoxURLBlacklistRegex";
    private static final String DETOX_URL_OVERRIDE_ARG = "detoxURLOverride";
    private static final List<String> RESERVED_INSTRUMENTATION_ARGS = Arrays.asList("class", "package", "func", "unit", "size", "perf", "debug", "log", "emma", "coverageFile");

    public boolean hasNotificationPath() {
        return InstrumentationRegistry.getArguments().containsKey(DETOX_NOTIFICATION_PATH_ARG);
    }

    public String getNotificationPath() {
        return InstrumentationRegistry.getArguments().getString(DETOX_NOTIFICATION_PATH_ARG);
    }

    public boolean hasUrlOverride() {
        return InstrumentationRegistry.getArguments().containsKey(DETOX_URL_OVERRIDE_ARG);
    }

    public String getURLBlacklist() {
        return InstrumentationRegistry.getArguments().getString(DETOX_BLACKLIST_URLS_ARG);
    }

    public boolean hasURLBlacklist() {
        return InstrumentationRegistry.getArguments().containsKey(DETOX_BLACKLIST_URLS_ARG);
    }

    public String getUrlOverride() {
        return InstrumentationRegistry.getArguments().getString(DETOX_URL_OVERRIDE_ARG);
    }

    public String getDetoxServerUrl() {
        return InstrumentationRegistry.getArguments().getString(DETOX_SERVER_URL_ARG);
    }

    public String getDetoxSessionId() {
        return InstrumentationRegistry.getArguments().getString(DETOX_SESSION_ID_ARG_KEY);
    }

    public Bundle asIntentBundle() {
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
