package com.wix.detox.espresso;

import android.support.test.espresso.IdlingResource;
import android.util.Log;

import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Created by simonracz on 28/07/2017.
 */

/**
 * <p>
 * IdlingResource for Espresso, which monitors the UI Module's state.
 *
 * </p>
 *
 * Deprecated in favor of the updated {@link ReactNativeUIModuleIdlingResource}
 */
@Deprecated
public class ReactViewHierarchyUpdateIdlingResource implements IdlingResource {
    private static final String LOG_TAG = "Detox";

    public final static String CLASS_UI_MANAGER_MODULE = "com.facebook.react.uimanager.UIManagerModule";
    public final static String METHOD_GET_NATIVE_MODULE = "getNativeModule";
    public final static String METHOD_GET_UI_IMPLEMENTATION = "getUIImplementation";
    public final static String METHOD_GET_UI_OPERATION_QUEUE = "getUIViewOperationQueue";
    public final static String METHOD_SET_VIEW_LISTENER = "setViewHierarchyUpdateDebugListener";

    private AtomicBoolean idleNow = new AtomicBoolean(true);
    // The flag should probably be a counter
    // instead of a boolean. However we can't set
    // up our listener before the first messages
    // arrive. We might have to fix this somehow later.
    // Currently we only log it, to gather data.
    private AtomicInteger debugCounter = new AtomicInteger(0);
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
        Log.i(LOG_TAG, "UI Module transitions to idle. DebugCounter : " + debugCounter.decrementAndGet());
    }

    //Proxy calls it
    public void onViewHierarchyUpdateEnqueued() {
        idleNow.set(false);
        Log.i(LOG_TAG, "UI Module transitions to busy. DebugCounter : " + debugCounter.incrementAndGet());
    }
}
