package com.wix.detox.espresso;

import android.support.annotation.NonNull;
import android.support.test.espresso.IdlingResource;
import android.util.Log;
import android.view.Choreographer;

import org.joor.Reflect;
import org.joor.ReflectException;

import java.util.PriorityQueue;
import java.util.concurrent.atomic.AtomicBoolean;

/**
 * Created by simonracz on 23/05/2017.
 */

/**
 * <p>
 * Espresso IdlingResource for React Native js timers.
 * </p>
 *
 * <p>
 * Hooks up to React Native internals to grab the timers queue from it.
 * </p>
 * <p>
 * This resource is considered idle if the Timers priority queue is empty or
 * the one scheduled the soonest is still too far in the future.
 * </p>
 */
public class ReactNativeTimersIdlingResource implements IdlingResource, Choreographer.FrameCallback {
    private static final String LOG_TAG = "Detox";

    private final static String CLASS_TIMING = "com.facebook.react.modules.core.Timing";
    private final static String METHOD_GET_NATIVE_MODULE = "getNativeModule";
    private final static String METHOD_HAS_NATIVE_MODULE = "hasNativeModule";
    private final static String FIELD_TIMERS = "mTimers";
    private final static String TIMER_FIELD_TARGET_TIME = "mTargetTime";
    private final static String TIMER_FIELD_INTERVAL = "mInterval";
    private final static String TIMER_FIELD_REPETITIVE = "mRepeat";
    private final static String FIELD_CATALYST_INSTANCE = "mCatalystInstance";
    private final static String LOCK_TIMER = "mTimerGuard";

    private AtomicBoolean paused = new AtomicBoolean(false);

    private static final long LOOK_AHEAD_MS = 1500;

    private ResourceCallback callback = null;
    private Object reactContext = null;

    public ReactNativeTimersIdlingResource(@NonNull Object reactContext) {
        this.reactContext = reactContext;
    }

    @Override
    public String getName() {
        return ReactNativeTimersIdlingResource.class.getName();
    }

    @Override
    public boolean isIdleNow() {
        if (paused.get()) {
            return true;
        }

        Class<?> timingClass;
        try {
            timingClass = Class.forName(CLASS_TIMING);
        } catch (ClassNotFoundException e) {
            Log.e(LOG_TAG, "Can't find Timing or Timing$Timer classes");
            if (callback != null) {
                callback.onTransitionToIdle();
            }
            return true;
        }

        try {
            // reactContext.hasActiveCatalystInstance() should be always true here
            // if called right after onReactContextInitialized(...)
            if (Reflect.on(reactContext).field(FIELD_CATALYST_INSTANCE).get() == null) {
                Log.e(LOG_TAG, "No active CatalystInstance. Should never see this.");
                return false;
            }

            if (!(boolean)Reflect.on(reactContext).call(METHOD_HAS_NATIVE_MODULE, timingClass).get()) {
                Log.e(LOG_TAG, "Can't find Timing NativeModule");
                if (callback != null) {
                    callback.onTransitionToIdle();
                }
                return true;
            }

            final Object timingModule = Reflect.on(reactContext).call(METHOD_GET_NATIVE_MODULE, timingClass).get();
            final Object timerLock = Reflect.on(timingModule).field(LOCK_TIMER).get();
            synchronized (timerLock) {
                final PriorityQueue<?> timers = Reflect.on(timingModule).field(FIELD_TIMERS).get();
                final Object nextTimer = findNextTimer(timers);
                if (nextTimer == null) {
                    if (callback != null) {
                        callback.onTransitionToIdle();
                    }
                    return true;
                }

//                Log.i(LOG_TAG, "Num of Timers : " + timers.size());

                if (isTimerOutsideBusyWindow(nextTimer)) {
                    if (callback != null) {
                        callback.onTransitionToIdle();
                    }
                    return true;
                }
            }

            Choreographer.getInstance().postFrameCallback(this);
            Log.i(LOG_TAG, "JS Timer is busy");
            return false;
        } catch (ReflectException e) {
            Log.e(LOG_TAG, "Can't set up RN timer listener", e.getCause());
        }

        if (callback != null) {
            callback.onTransitionToIdle();
        }
        return true;
    }

    @Override
    public void registerIdleTransitionCallback(ResourceCallback callback) {
        this.callback = callback;

        Choreographer.getInstance().postFrameCallback(this);
    }

    @Override
    public void doFrame(long frameTimeNanos) {
        isIdleNow();
    }

    public void pause() {
        paused.set(true);
        if (callback != null) {
            callback.onTransitionToIdle();
        }
    }
    public void resume() {
        paused.set(false);
    }

    private Object findNextTimer(PriorityQueue<?> timers) {
        Object nextTimer = timers.peek();
        if (nextTimer == null) {
            return null;
        }

        final boolean isRepetitive = Reflect.on(nextTimer).field(TIMER_FIELD_REPETITIVE).get();
        if (!isRepetitive) {
            return nextTimer;
        }

        Object timer = null;
        long targetTime = Long.MAX_VALUE;
        for (Object aTimer : timers) {
            final boolean timerIsRepetitive = Reflect.on(aTimer).field(TIMER_FIELD_REPETITIVE).get();
            final long timerTargetTime = Reflect.on(aTimer).field(TIMER_FIELD_TARGET_TIME).get();
            if (!timerIsRepetitive && timerTargetTime < targetTime) {
                targetTime = timerTargetTime;
                timer = aTimer;
            }
        }
        return timer;
    }

    private boolean isTimerOutsideBusyWindow(Object nextTimer) {
        final long currentTimeMS = System.nanoTime() / 1000000L;
        final Reflect nextTimerReflected = Reflect.on(nextTimer);
        final long targetTimeMS = nextTimerReflected.field(TIMER_FIELD_TARGET_TIME).get();
        final int intervalMS = nextTimerReflected.field(TIMER_FIELD_INTERVAL).get();

//        Log.i(LOG_TAG, "Next timer has duration of: " + intervalMS
//                + "; due time is: " + targetTimeMS + ", current is: " + currentTimeMS);

        // Core condition is for the timer interval (duration) to be set beyond our window.
        // Note: we check the interval in an 'absolute' way rather than comparing to the 'current time'
        //    since it always takes a while till we get dispatched (compared to when the timer was created),
        //    and that could make a significant difference in timers set close to our window (up to ~ LOOK_AHEAD_MS+200ms).
        if (intervalMS > LOOK_AHEAD_MS) {
            return true;
        }

        // Edge case: timer has expired during this probing process and is yet to have left the queue.
        if (targetTimeMS <= currentTimeMS) {
            return true;
        }

        return false;
    }
}
