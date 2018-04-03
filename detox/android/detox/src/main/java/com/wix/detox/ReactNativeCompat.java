package com.wix.detox;

import org.joor.Reflect;

import java.util.Map;

public class ReactNativeCompat {
    static Map<String, Object> VERSION;

    static {
        try {
            Class reactNativeVersion = Class.forName("com.facebook.react.modules.systeminfo.ReactNativeVersion");
            VERSION = Reflect.on(reactNativeVersion).field("VERSION").get();
        } catch (ClassNotFoundException e) {
        }

    }

    public static int getMinor() {
        return (Integer) VERSION.get("minor");
    }

    public static void waitForReactNativeLoad(Object reactNativeHostHolder) {
        if (getMinor() >= 50) {
            ReactNativeSupport.waitForReactNativeLoad(reactNativeHostHolder);
            try {
                //TODO- Temp hack to make Detox usable for RN>=50 till we find a better sync solution.
                Thread.sleep(1000);
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
        } else {
            ReactNativeSupport.waitForReactNativeLoad(reactNativeHostHolder);
        }
    }
}
