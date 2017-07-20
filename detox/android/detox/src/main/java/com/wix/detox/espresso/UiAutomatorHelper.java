package com.wix.detox.espresso;

import android.app.UiAutomation;
import android.content.Context;
import android.support.test.InstrumentationRegistry;
import android.support.test.espresso.Espresso;
import android.support.test.espresso.ViewInteraction;
import android.support.test.uiautomator.InstrumentationUiAutomatorBridge;
import android.util.Log;
import android.view.View;

import org.hamcrest.core.IsAnything;
import org.joor.Reflect;
import org.joor.ReflectException;

/**
 * Created by simonracz on 19/07/2017.
 */

public class UiAutomatorHelper {
    private static final String LOG_TAG = "detox";

    private static final String CLASS_INTERACTION_CONTROLLER =
            "android.support.test.uiautomator.InteractionController";

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

    private static Object interactionController = null;

    public static Object getInteractionController() {
        if (interactionController != null) {
            return interactionController;
        }
        UiAutomation uiAutomation;
        if (android.os.Build.VERSION.SDK_INT >= 24) {
            uiAutomation = InstrumentationRegistry.getInstrumentation().getUiAutomation(UiAutomation.FLAG_DONT_SUPPRESS_ACCESSIBILITY_SERVICES);
        } else {
            uiAutomation = InstrumentationRegistry.getInstrumentation().getUiAutomation();
        }
        Context ctx = InstrumentationRegistry.getContext();
        InstrumentationUiAutomatorBridge bridge = new InstrumentationUiAutomatorBridge(ctx, uiAutomation);
        Class<?> interActionControllerClass;
        try {
            interActionControllerClass = Class.forName(CLASS_INTERACTION_CONTROLLER);
        } catch (ClassNotFoundException e) {
            Log.e(LOG_TAG, "Can't find InteractionController class. UiAutomator is not on classpath?", e);
            throw new RuntimeException(e);
        }
        interactionController = Reflect.on(interActionControllerClass).create(bridge).get();
        return interactionController;
    }

    public static float getDensity(){
        Context context = InstrumentationRegistry.getTargetContext().getApplicationContext();
        return context.getResources().getDisplayMetrics().density;
    }

    public static int convertDiptoPix(float dip){
        return (int) (dip * getDensity() + 0.5f);
    }

    public static int convertPixtoDip(int pixel){
        return (int)((pixel - 0.5f) / getDensity());
    }

}
