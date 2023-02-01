package com.example.utils;

import java.lang.reflect.Method;

public class ReactNativeExtensionReflected {
    private final Method toggleUISynchronization;
    private final Method toggleTimersSynchronization;
    private final Method toggleNetworkSynchronization;

    static private ReactNativeExtensionReflected INSTANCE = null;
    static public ReactNativeExtensionReflected getInstance() {
        if (INSTANCE == null) {
            INSTANCE = new ReactNativeExtensionReflected();
        }
        return INSTANCE;
    }

    private ReactNativeExtensionReflected() {
        try {
            Class<?> clazz = Class.forName("com.wix.detox.reactnative.ReactNativeExtension");
            toggleUISynchronization = clazz.getDeclaredMethod("toggleUISynchronization", boolean.class);
            toggleTimersSynchronization = clazz.getDeclaredMethod("toggleTimersSynchronization", boolean.class);
            toggleNetworkSynchronization = clazz.getDeclaredMethod("toggleNetworkSynchronization", boolean.class);
        } catch (Exception e) {
            throw new IllegalStateException(e);
        }
    }

    public void toggleUISynchronization(boolean enable) {
        invokeToggleMethod(toggleUISynchronization, enable);
    }

    public void toggleTimersSynchronization(boolean enable) {
        invokeToggleMethod(toggleTimersSynchronization, enable);
    }

    public void toggleNetworkSynchronization(boolean enable) {
        invokeToggleMethod(toggleNetworkSynchronization, enable);
    }

    private void invokeToggleMethod(Method method, boolean enable) {
        try {
            method.invoke(null, enable);
        } catch (Exception e) {
            throw new IllegalStateException(e);
        }
    }
}
