package com.wix.detox.espresso;

import android.support.annotation.NonNull;
import android.support.annotation.Nullable;
import android.support.test.espresso.IdlingResource;
import android.util.Log;

import org.joor.Reflect;

import java.util.ArrayList;
import java.util.regex.Pattern;
import java.util.regex.PatternSyntaxException;

import okhttp3.Dispatcher;

/**
 * Created by simonracz on 24/08/2017.
 */


/**
 * Idling Resource which monitors React Native's OkHttpClient.
 *
 * Must call stop() on it, before removing it from Espresso.
 * @deprecated Please use RNExperimentalNetworkIR
 */
public class ReactNativeNetworkIdlingResource implements IdlingResource {

    private static final String LOG_TAG = "Detox";

    private ResourceCallback resourceCallback;
    private Dispatcher dispatcher;
    private ForwardingIdleCallback forwardingIdleCallback;
    private static final String FIELD_IDLE_CB = "idleCallback";

    public ReactNativeNetworkIdlingResource(@NonNull Dispatcher dispatcher) {
        this.dispatcher = dispatcher;
    }

    @Override
    public String getName() {
        return ReactNativeNetworkIdlingResource.class.getName();
    }

    @Override
    public boolean isIdleNow() {
        boolean idle = dispatcher.runningCallsCount() == 0;
        if (idle && resourceCallback != null) {
            resourceCallback.onTransitionToIdle();
        }
        if (!idle) {
            Log.i(LOG_TAG, "Network is busy");
        }
        return idle;
    }

    @Override
    public void registerIdleTransitionCallback(ResourceCallback callback) {
        resourceCallback = callback;
        Runnable rootIdleCallback = Reflect.on(dispatcher).field(FIELD_IDLE_CB).get();
        forwardingIdleCallback = new ForwardingIdleCallback(rootIdleCallback, resourceCallback);
        dispatcher.setIdleCallback(forwardingIdleCallback);
    }

    public void stop() {
        Runnable rootIdleCallback = forwardingIdleCallback.getRootIdleCallback();
        dispatcher.setIdleCallback(rootIdleCallback);
        forwardingIdleCallback = null;
    }

    private class ForwardingIdleCallback implements Runnable {
        Runnable rootIdleCallback;
        ResourceCallback resCallback;
        ForwardingIdleCallback(@Nullable Runnable rootIdleCallback, @NonNull ResourceCallback resCallback) {
            this.rootIdleCallback = rootIdleCallback;
            this.resCallback = resCallback;
        }
        @Override
        public void run() {
            resCallback.onTransitionToIdle();
            if (rootIdleCallback != null) {
                rootIdleCallback.run();
            }
        }
        Runnable getRootIdleCallback() {
            return rootIdleCallback;
        }
    }
}
