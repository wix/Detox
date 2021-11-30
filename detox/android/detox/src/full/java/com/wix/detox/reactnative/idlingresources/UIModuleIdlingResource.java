package com.wix.detox.reactnative.idlingresources;

import android.util.Log;
import android.view.Choreographer;

import org.jetbrains.annotations.NotNull;
import org.joor.Reflect;
import org.joor.ReflectException;

import androidx.annotation.NonNull;

import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import java.util.List;


/**
 * Created by simonracz on 26/07/2017.
 */

/**
 * <p>
 * Espresso IdlingResource for React Native's UI Module.
 * </p>
 *
 * <p>
 * Hooks up to React Native internals to grab the pending ui operations from it.
 * </p>
 *
 * TODO Rewrite this awful, awful class
 */
public class UIModuleIdlingResource extends DetoxBaseIdlingResource implements Choreographer.FrameCallback {
    private static final String LOG_TAG = "Detox";

    private final static String CLASS_UI_MANAGER_MODULE = "com.facebook.react.uimanager.UIManagerModule";
    private final static String METHOD_GET_NATIVE_MODULE = "getNativeModule";
    private final static String METHOD_HAS_NATIVE_MODULE = "hasNativeModule";
    private final static String METHOD_GET_UI_IMPLEMENTATION = "getUIImplementation";
    private final static String FIELD_UI_OPERATION_QUEUE = "mOperationsQueue";
    private final static String METHOD_IS_EMPTY = "isEmpty";
    private final static String FIELD_DISPATCH_RUNNABLES = "mDispatchUIRunnables";
    private final static String FIELD_NON_BATCHES_OPERATIONS = "mNonBatchedOperations";
    private final static String FIELD_CATALYST_INSTANCE = "mCatalystInstance";
    private final static String LOCK_RUNNABLES = "mDispatchRunnablesLock";
    private final static String LOCK_OPERATIONS = "mNonBatchedOperationsLock";
    private final static String CLASS_DISPATCH_COMMAND_VIEW_OPERATION =
            "com.facebook.react.uimanager.UIViewOperationQueue$DispatchCommandViewOperation";
    private final static String FIELD_MVIEW_COMMAND_OPERATIONS = "mViewCommandOperations";
    private final static String CLASS_READABLE_ARRAY = "com.facebook.react.bridge.ReadableArray";
    private final static String FIELD_MARGS = "mArgs";
    private final static String METHOD_GET_BOOLEAN = "getBoolean";
    private final static String FIELD_NUM_RETRIES = "numRetries";
    private final static String FIELD_MCOMMAND = "mCommand";
    private final static String SET_NATIVE_VALUE = "setNativeValue";

    private ResourceCallback callback;
    private Object reactContext;

    public UIModuleIdlingResource(@NonNull Object reactContext) {
        this.reactContext = reactContext;
    }

    @Override
    public String getName() {
        return UIModuleIdlingResource.class.getName();
    }

    @NotNull
    @Override
    public String getDescription() {
        return "UI rendering activity";
    }

    @Override
    protected boolean checkIdle() {
        Class<?> uiModuleClass;
        try {
            uiModuleClass = Class.forName(CLASS_UI_MANAGER_MODULE);
        } catch (ClassNotFoundException e) {
            Log.e(LOG_TAG, "UIManagerModule is not on classpath.");
            notifyIdle();
            return true;
        }

        try {
            // reactContext.hasActiveCatalystInstance() should be always true here
            // if called right after onReactContextInitialized(...)
            if (Reflect.on(reactContext).field(FIELD_CATALYST_INSTANCE).get() == null) {
                Log.e(LOG_TAG, "No active CatalystInstance. Should never see this.");
                return false;
            }

            if (!(boolean)Reflect.on(reactContext).call(METHOD_HAS_NATIVE_MODULE, uiModuleClass).get()) {
                Log.e(LOG_TAG, "Can't find UIManagerModule.");
                notifyIdle();
                return true;
            }

            Object uiOperationQueue = Reflect.on(reactContext)
                    .call(METHOD_GET_NATIVE_MODULE, uiModuleClass)
                    .call(METHOD_GET_UI_IMPLEMENTATION)
                    .field(FIELD_UI_OPERATION_QUEUE)
                    .get();
            Object runnablesLock = Reflect.on(uiOperationQueue).field(LOCK_RUNNABLES).get();
            Object operationsLock = Reflect.on(uiOperationQueue).field(LOCK_OPERATIONS).get();

            boolean runnablesAreEmpty;
            boolean nonBatchesOpsEmpty;
            synchronized (runnablesLock) {
                runnablesAreEmpty = Reflect.on(uiOperationQueue)
                        .field(FIELD_DISPATCH_RUNNABLES)
                        .call(METHOD_IS_EMPTY).get();
            }
            synchronized (operationsLock) {
                nonBatchesOpsEmpty = Reflect.on(uiOperationQueue)
                        .field(FIELD_NON_BATCHES_OPERATIONS)
                        .call(METHOD_IS_EMPTY).get();
            }

            boolean isOperationQueueEmpty = Reflect.on(uiOperationQueue).call(METHOD_IS_EMPTY).get();

            if (!isOperationQueueEmpty) {
                isOperationQueueEmpty = workaroundForRN66Bug(uiOperationQueue);
            }

            if (runnablesAreEmpty && nonBatchesOpsEmpty && isOperationQueueEmpty) {
                notifyIdle();
                // Log.i(LOG_TAG, "UIManagerModule is idle.");
                return true;
            }

            Log.i(LOG_TAG, "UIManagerModule is busy");
            Choreographer.getInstance().postFrameCallback(this);
            return false;
        } catch (ReflectException e) {
            Log.e(LOG_TAG, "Can't set up RN UIModule listener", e.getCause());
        }

        notifyIdle();
        return true;
    }

    // This is a workaround for https://github.com/facebook/react-native/issues/32594
    // uses duck typing heuristics to determine that this is probably the stuck Switch operation and if so, ignores it
    private boolean workaroundForRN66Bug(Object uiOperationQueue) {
        boolean isStuckSwitchOperation = false;

        try {
            Class<?> DispatchCommandViewOperation = Class.forName(CLASS_DISPATCH_COMMAND_VIEW_OPERATION);
            List<?> mViewCommandOperations = Reflect.on(uiOperationQueue).field(FIELD_MVIEW_COMMAND_OPERATIONS).get();

            if (mViewCommandOperations.size() == 1) {
                Class<?> ReadableArray = Class.forName(CLASS_READABLE_ARRAY);
                Object viewOperation = DispatchCommandViewOperation.cast(mViewCommandOperations.get(0));

                Object viewArgs = ReadableArray.cast(Reflect.on(viewOperation).field(FIELD_MARGS).get());
                Method getReadableArrayBoolean = viewArgs.getClass().getDeclaredMethod(METHOD_GET_BOOLEAN, int.class);
                getReadableArrayBoolean.setAccessible(true);
                Boolean nativeValueArg = (Boolean) getReadableArrayBoolean.invoke(viewArgs, 0);

                int numRetries = Reflect.on(viewOperation).field(FIELD_NUM_RETRIES).get();
                String mCommand = Reflect.on(viewOperation).field(FIELD_MCOMMAND).get();

                isStuckSwitchOperation = (numRetries == 1 && mCommand.equals(SET_NATIVE_VALUE) && nativeValueArg != null);
            }
        } catch (ClassNotFoundException | IllegalArgumentException | NoSuchMethodException | IllegalAccessException | InvocationTargetException ignored) {}
        return isStuckSwitchOperation;
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

    @Override
    protected void notifyIdle() {
        if (callback != null) {
            callback.onTransitionToIdle();
        }
    }
}
