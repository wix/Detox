package com.wix.detox.reactnative.idlingresources;

import android.util.Log;

import com.facebook.react.bridge.NotThreadSafeBridgeIdleDebugListener;
import com.facebook.react.bridge.ReactContext;

import java.util.concurrent.atomic.AtomicBoolean;

import androidx.test.espresso.IdlingResource;

/**
 * Created by simonracz on 01/06/2017.
 */

/**
 * <p>
 * IdlingResource for Espresso, which monitors the traffic of
 * React Native's JS bridge.
 * </p>
 */
public class BridgeIdlingResource implements IdlingResource, NotThreadSafeBridgeIdleDebugListener {
    private static final String LOG_TAG = "Detox";

    private AtomicBoolean idleNow = new AtomicBoolean(true);
    private ResourceCallback callback = null;

    public BridgeIdlingResource(ReactContext reactContext) {
        reactContext.getCatalystInstance().addBridgeIdleDebugListener(this);
    }

    @Override
    public String getName() {
        return BridgeIdlingResource.class.getName();
    }

    @Override
    public boolean isIdleNow() {
        boolean ret = idleNow.get();
        if (!ret) {
            Log.i(LOG_TAG, "JS Bridge is busy");
        }
        return ret;
    }

    @Override
    public void registerIdleTransitionCallback(ResourceCallback callback) {
        this.callback = callback;
    }

    @Override
    public void onTransitionToBridgeIdle() {
        idleNow.set(true);
        if (callback != null) {
            callback.onTransitionToIdle();
        }
        // Log.i(LOG_TAG, "JS Bridge transitions to idle.");
    }

    @Override
    public void onTransitionToBridgeBusy() {
        idleNow.set(false);
        // Log.i(LOG_TAG, "JS Bridge transitions to busy.");
    }

    public void onBridgeDestroyed() {
    }
}
