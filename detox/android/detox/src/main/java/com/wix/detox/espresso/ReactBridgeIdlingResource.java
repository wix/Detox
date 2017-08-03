package com.wix.detox.espresso;

import android.support.test.espresso.IdlingResource;
import android.util.Log;

import java.util.concurrent.atomic.AtomicBoolean;

/**
 * Created by simonracz on 01/06/2017.
 */

/**
 * <p>
 * IdlingResource for Espresso, which monitors the traffic of
 * React Native's JS bridge.
 * </p>
 */
public class ReactBridgeIdlingResource implements IdlingResource {
    private static final String LOG_TAG = "Detox";

    private AtomicBoolean idleNow = new AtomicBoolean(true);
    private ResourceCallback callback = null;

    @Override
    public String getName() {
        return ReactBridgeIdlingResource.class.getName();
    }

    @Override
    public boolean isIdleNow() {
        boolean ret = idleNow.get();
        Log.i(LOG_TAG, "JS Bridge is idle : " + String.valueOf(ret));
        return ret;
    }

    @Override
    public void registerIdleTransitionCallback(ResourceCallback callback) {
        this.callback = callback;
    }

    // Proxy calls it
    public void onTransitionToBridgeIdle() {
        idleNow.set(true);
        if (callback != null) {
            callback.onTransitionToIdle();
        }
        Log.i(LOG_TAG, "JS Bridge transitions to idle.");
    }

    //Proxy calls it
    public void onTransitionToBridgeBusy() {
        idleNow.set(false);
        Log.i(LOG_TAG, "JS Bridge transitions to busy.");
    }
}
