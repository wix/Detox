package com.wix.detox.espresso;

import android.support.test.espresso.IdlingResource;
import android.util.Log;

import java.util.concurrent.atomic.AtomicBoolean;

/**
 * Created by simonracz on 28/07/2017.
 */

/**
 * <p>
 * IdlingResource for Espresso, which monitors the UI Module's state.
 * </p>
 */
public class ReactViewHierarchyUpdateIdlingResource implements IdlingResource {
    private static final String LOG_TAG = "Detox";

    public final static String CLASS_UI_MANAGER_MODULE = "com.facebook.react.uimanager.UIManagerModule";
    public final static String METHOD_GET_NATIVE_MODULE = "getNativeModule";
    public final static String METHOD_GET_UI_IMPLEMENTATION = "getUIImplementation";
    public final static String METHOD_GET_UI_OPERATION_QUEUE = "getUIViewOperationQueue";
    public final static String METHOD_SET_VIEW_LISTENER = "setViewHierarchyUpdateDebugListener";

    private AtomicBoolean idleNow = new AtomicBoolean(false);
    private ResourceCallback callback = null;

    @Override
    public String getName() {
        return ReactViewHierarchyUpdateIdlingResource.class.getName();
    }

    @Override
    public boolean isIdleNow() {
        boolean ret = idleNow.get();
        Log.i(LOG_TAG, "UI Module is idle : " + String.valueOf(ret));
        return ret;
    }

    @Override
    public void registerIdleTransitionCallback(ResourceCallback callback) {
        this.callback = callback;
    }

    // Proxy calls it
    public void onViewHierarchyUpdateFinished() {
        idleNow.set(true);
        if (callback != null) {
            callback.onTransitionToIdle();
        }
        Log.i(LOG_TAG, "UI Module transitions to idle.");
    }

    //Proxy calls it
    public void onViewHierarchyUpdateEnqueued() {
        idleNow.set(false);
        Log.i(LOG_TAG, "UI Module transitions to busy.");
    }
}
