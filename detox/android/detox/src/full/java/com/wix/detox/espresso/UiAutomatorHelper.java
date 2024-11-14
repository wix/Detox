package com.wix.detox.espresso;

import android.annotation.SuppressLint;
import android.content.Context;
import android.os.Handler;
import android.util.DisplayMetrics;
import android.util.Log;
import android.util.TypedValue;
import android.view.Choreographer;
import android.view.View;

import com.wix.detox.common.UIThread;
import com.wix.detox.espresso.action.common.utils.UiControllerUtils;

import org.joor.Reflect;
import org.joor.ReflectException;

import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;

import androidx.test.platform.app.InstrumentationRegistry;

/**
 * Created by simonracz on 19/07/2017.
 */

public class UiAutomatorHelper {
    private static final String LOG_TAG = "detox";

    private static final String METHOD_LOOP_UNTIL_IDLE = "loopMainThreadUntilIdle";
    private static final String METHOD_LOOP_AT_LEAST = "loopMainThreadForAtLeast";

    /**
     * This triggers a full Espresso sync. It's intended use is to sync UIAutomator calls.
     */
    public static void espressoSync() {
        // I want to invoke Espresso's sync mechanism manually.
        // This turned out to be amazingly difficult. This below is the
        // nicest solution I could come up with.
        UIThread.runSync(new Runnable() {
            @Override
            public void run() {
                try {
                    Reflect.on(UiControllerUtils.getUiController()).call(METHOD_LOOP_UNTIL_IDLE);
                } catch (ReflectException e) {
                    Log.e(LOG_TAG, "Failed to sync Espresso manually.", e.getCause());
                }
            }
        });
    }

    /**
     * This triggers a full Espresso sync. Waits at least millis amount of time.
     *
     * @param millis waits at least this amount of time
     */
    public static void espressoSync(final long millis) {
        // I want to invoke Espresso's sync mechanism manually.
        // This turned out to be amazingly difficult. This below is the
        // nicest solution I could come up with.
        UIThread.runSync(new Runnable() {
            @Override
            public void run() {
                try {
                    Reflect.on(UiControllerUtils.getUiController()).call(METHOD_LOOP_AT_LEAST, millis);
                } catch (ReflectException e) {
                    Log.e(LOG_TAG, "Failed to sync Espresso manually.", e.getCause());
                }
            }
        });
    }

    /**
     * Waits for some Choreographer calls.
     * <p>
     * React Native uses Choreographer callbacks. Those are invisible to Espresso.
     * One of them is UIModule, UIViewOperationQueue.
     * <p>
     * After everything idled out, we should still wait for UIModule to initiate it's changes
     * on the UI by waiting out its Choreographer frame.
     * <p>
     * TODO:
     * Find a way to wrap up the UIModule in an Espresso IdlingResource, similar to JS Timers.
     */
    private static void waitForChoreographer() {
        final int waitFrameCount = 2;
        final CountDownLatch latch = new CountDownLatch(1);
        Handler handler = new Handler(InstrumentationRegistry.getInstrumentation().getTargetContext().getMainLooper());
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

    @SuppressLint({"DiscouragedApi", "InternalInsetResource"})
    public static int getStatusBarHeightDps(View view) {
        Context context = view.getContext();
        int resourceId = context.getResources().getIdentifier("status_bar_height", "dimen", "android");
        return (int) (context.getResources().getDimensionPixelSize(resourceId) / ((float) context.getResources().getDisplayMetrics().densityDpi / DisplayMetrics.DENSITY_DEFAULT));
    }
}
