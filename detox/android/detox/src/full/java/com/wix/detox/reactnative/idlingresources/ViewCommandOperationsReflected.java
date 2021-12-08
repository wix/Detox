package com.wix.detox.reactnative.idlingresources;

import android.util.Log;

import com.facebook.react.uimanager.NativeViewHierarchyManager;
import com.facebook.react.uimanager.UIViewOperationQueue;

import java.util.List;

import org.joor.Reflect;

class ViewCommandOperationsReflected {
    private static final String LOG_TAG = "Detox";
    private final static String CLASS_DISPATCH_COMMAND_OPERATION =
            "com.facebook.react.uimanager.UIViewOperationQueue$DispatchStringCommandOperation";
    private final static String FIELD_MVIEW_COMMAND_OPERATIONS = "mViewCommandOperations";
    private final static String FIELD_NUM_RETRIES = "numRetries";
    private final static String FIELD_MTAG = "mTag";
    private final static String FIELD_MCOMMAND = "mCommand";
    private final static String FIELD_MVIEW_MANAGERS = "mNativeViewHierarchyManager";
    private final static String SET_NATIVE_VALUE = "setNativeValue";
    private final static String REACT_SWITCH = "ReactSwitch";

    // This is a workaround for https://github.com/facebook/react-native/issues/32594
    // uses duck typing heuristics to determine that this is probably the stuck Switch operation and if so, ignores it
    static boolean workaroundForRN66Bug(Object uiOperationQueue) {
        boolean isStuckSwitchOperation = false;

        try {
            Class<?> DispatchStringCommandOperation = Class.forName(CLASS_DISPATCH_COMMAND_OPERATION);
            List<?> mViewCommandOperations = Reflect.on(uiOperationQueue).field(FIELD_MVIEW_COMMAND_OPERATIONS).get();

            if (mViewCommandOperations.size() == 1) {
                Object viewOperation = DispatchStringCommandOperation.cast(mViewCommandOperations.get(0));

                int mTag = Reflect.on(viewOperation).field(FIELD_MTAG).get();
                UIViewOperationQueue uiManagerModule = (UIViewOperationQueue) uiOperationQueue;
                NativeViewHierarchyManager nativeHierarchyManager = Reflect.on(uiManagerModule).field(FIELD_MVIEW_MANAGERS).get();
                String mClassName = nativeHierarchyManager.resolveView(mTag).getClass().getSimpleName();

                int numRetries = Reflect.on(viewOperation).field(FIELD_NUM_RETRIES).get();
                String mCommand = Reflect.on(viewOperation).field(FIELD_MCOMMAND).get();

                boolean isReactSwitch = mClassName.equals(REACT_SWITCH);
                boolean hasOneRetryIncremented = numRetries == 1;
                boolean isSetNativeValueCommand = mCommand.equals(SET_NATIVE_VALUE);

                isStuckSwitchOperation = (isReactSwitch && hasOneRetryIncremented && isSetNativeValueCommand);
            }
        } catch (ClassNotFoundException e) {
            Log.d(LOG_TAG, String.valueOf(e.getCause()));
        }
        return isStuckSwitchOperation;
    }
}