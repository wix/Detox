package com.wix.detox.espresso;

import android.app.UiAutomation;
import android.content.Context;
import android.os.Handler;
import android.support.test.InstrumentationRegistry;
import android.support.test.espresso.Espresso;
import android.support.test.espresso.ViewInteraction;
import android.support.test.uiautomator.InstrumentationUiAutomatorBridge;
import android.util.Log;
import android.view.Choreographer;
import android.view.View;

import org.hamcrest.core.IsAnything;
import org.joor.Reflect;
import org.joor.ReflectException;

import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;

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
    public static void espressoSync() {
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

    /**
     * Waits for some Choreographer calls.
     *
     * React Native uses Choreographer callbacks. Those are invisible to Espresso.
     * One of them is UIModule, UIViewOperationQueue.
     *
     * After everything idled out, we should still wait for UIModule to initiate it's changes
     * on the UI by waiting out its Choreographer frame.
     *
     * TODO:
     * Find a way to wrap up the UIModule in an Espresso IdlingResource, similar to JS Timers.
     */
    private static void waitForChoreographer() {
        final int waitFrameCount = 2;
        final CountDownLatch latch = new CountDownLatch(1);
        Handler handler = new Handler(InstrumentationRegistry.getTargetContext().getMainLooper());
        handler.post(
                new Runnable() {
                    @Override
                    public void run() {
                        Choreographer.getInstance().postFrameCallback(
                                new Choreographer.FrameCallback() {

                                    private int frameCount = 0;

                                    @Override
                                    public void doFrame(long frameTimeNanos) {
                                        frameCount++;
                                        if (frameCount == waitFrameCount) {
                                            latch.countDown();
                                        } else {
                                            Choreographer.getInstance().postFrameCallback(this);
                                        }
                                    }
                                });
                    }
                });
        try {
            if (!latch.await(500, TimeUnit.MILLISECONDS)) {
                throw new RuntimeException("Timed out waiting for Choreographer");
            }
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

}
