package com.wix.detox.reactnative.idlingresources;

import android.annotation.SuppressLint;
import android.os.Debug;
import android.util.Log;
import android.view.Choreographer;

import com.facebook.react.animated.NativeAnimatedModule;
import com.facebook.react.bridge.ReactContext;
import com.wix.detox.espresso.idlingresources.DescriptiveIdlingResource;

import org.joor.Reflect;
import org.joor.ReflectException;

import java.util.HashMap;
import java.util.Map;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

/**
 * Created by simonracz on 25/08/2017.
 */

/**
 * <p>
 * Espresso IdlingResource for React Native's Animated Module.
 * </p>
 * <p>
 * <p>
 * Hooks up to React Native internals to monitor the state of the animations.
 * </p>
 * <p>
 * This Idling Resource is inherently tied to the UI Module IR. It must be registered after
 * the UI Module IR. This order is not enforced now.
 *
 * @see <a href="https://github.com/facebook/react-native/blob/259eac8c30b536abddab7925f4c51f0bf7ced58d/ReactAndroid/src/main/java/com/facebook/react/animated/NativeAnimatedModule.java#L143">AnimatedModule</a>
 */
public class AnimatedModuleIdlingResource implements DescriptiveIdlingResource, Choreographer.FrameCallback {
    private static final String LOG_TAG = "Detox";

    private final static String CLASS_ANIMATED_MODULE = "com.facebook.react.animated.NativeAnimatedModule";
    private final static String METHOD_GET_NATIVE_MODULE = "getNativeModule";
    private final static String METHOD_HAS_NATIVE_MODULE = "hasNativeModule";
    private final static String METHOD_IS_EMPTY = "isEmpty";

    private final static String LOCK_OPERATIONS = "mOperationsCopyLock";
    private final static String FIELD_OPERATIONS = "mReadyOperations";
    private final static String FIELD_NODES_MANAGER = "mNodesManager";

    private final static String FIELD_ITERATIONS = "mIterations";
    private final static String FIELD_ACTIVE_ANIMATIONS = "mActiveAnimations";
    private final static String FIELD_UPDATED_NODES = "mUpdatedNodes";
    private final static String FIELD_CATALYST_INSTANCE = "mCatalystInstance";

    private final static String METHOD_SIZE = "size";
    private final static String METHOD_VALUE_AT = "valueAt";

    private final static String METHOD_HAS_ACTIVE_ANIMATIONS = "hasActiveAnimations";

    private final static Map<String, Object> busyHint = new HashMap<String, Object>() {{
        put("reason", "Animations running on screen");
    }};

    private ResourceCallback callback = null;
    private ReactContext reactContext = null;

    public AnimatedModuleIdlingResource(@NonNull ReactContext reactContext) {
        this.reactContext = reactContext;
    }

    @Override
    public String getName() {
        return AnimatedModuleIdlingResource.class.getName();
    }

    @NonNull
    @Override
    public String getDebugName() {
        return "ui";
    }

    @Nullable
    @Override
    public Map<String, Object> getBusyHint() {
        return busyHint;
    }

    @Override
    public boolean isIdleNow() {
        Class<?> animModuleClass = null;
        try {
            animModuleClass = Class.forName(CLASS_ANIMATED_MODULE);
        } catch (ClassNotFoundException e) {
            Log.e(LOG_TAG, "Animated Module is not on classpath.");
            if (callback != null) {
                callback.onTransitionToIdle();
            }
            return true;
        }

        try {

            if (isIdle(animModuleClass)) {
                return true;
            }


            Log.i(LOG_TAG, "AnimatedModule is busy.");
            Choreographer.getInstance().postFrameCallback(this);
            return false;
        } catch (ReflectException e) {
            Log.e(LOG_TAG, "Couldn't set up RN AnimatedModule listener, old RN version?");
            Log.e(LOG_TAG, "Can't set up RN AnimatedModule listener", e.getCause());
        }

        if (callback != null) {
            callback.onTransitionToIdle();
        }
//        Log.i(LOG_TAG, "AnimatedModule is idle.");
        return true;
    }

    @SuppressLint("UnsafeOptInUsageError")
    private boolean isIdle(Object animModuleClass) {
        NativeAnimatedModule animatedModule = reactContext.getNativeModule(NativeAnimatedModule.class);
        //Debug.waitForDebugger();
        boolean hasActiveAnimations = animatedModule.getNodesManager().hasActiveAnimations();
        if (!hasActiveAnimations) {
            if (callback != null) {
                callback.onTransitionToIdle();
            }
//            Log.i(LOG_TAG, "AnimatedModule is idle, no operations");
            return true;
        }
        return false;
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
}

