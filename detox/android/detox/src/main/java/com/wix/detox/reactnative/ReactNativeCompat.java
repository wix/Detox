package com.wix.detox.reactnative;

import org.joor.Reflect;

import java.util.HashMap;
import java.util.Map;

public class ReactNativeCompat {
    private static Map<String, Object> VERSION;

    static {
        try {
            Class reactNativeVersion = Class.forName("com.facebook.react.modules.systeminfo.ReactNativeVersion");
            VERSION = Reflect.on(reactNativeVersion).field("VERSION").get();
        } catch (ClassNotFoundException e) {
            //ReactNativeVersion was introduced in RN50, default to latest previous version.
            VERSION = new HashMap<>();
            VERSION.put("major", 0);
            VERSION.put("minor", 49);
            VERSION.put("patch", 0);
        }

    }

    public static int getMinor() {
        return (Integer) VERSION.get("minor");
    }
}
