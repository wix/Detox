package com.wix.detox.espresso;

import android.support.test.InstrumentationRegistry;
import android.support.test.espresso.Espresso;
import android.support.test.espresso.ViewInteraction;
import android.util.Log;
import android.view.View;

import org.hamcrest.core.IsAnything;
import org.joor.Reflect;
import org.joor.ReflectException;

/**
 * Created by rotemm on 26/12/2016.
 */

public class EspressoDetox {
    private static final String LOG_TAG = "detox";

    /**
     * This triggers a full Espresso sync. It's intended use is to sync UIAutomator calls.
     */
    public static void sync() {
        // I want to invoke Espresso's sync mechanism manually.
        // This turned out to be amazingly difficult. This below is the
        // nicest solution I could come up with.
        final ViewInteraction interaction = Espresso.onView(new IsAnything<View>());
        InstrumentationRegistry.getInstrumentation().runOnMainSync(new Runnable() {
            @Override
            public void run() {
                try {
                    Reflect.on(interaction).field("uiController").call("loopMainThreadUntilIdle");
                } catch (ReflectException e) {
                    Log.e(LOG_TAG, "Failed to sync Espresso manually.", e.getCause());
                }
            }
        });
    }


}
