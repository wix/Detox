package com.wix.detox;

import android.os.Looper;
import android.support.annotation.NonNull;
import android.support.test.InstrumentationRegistry;
import android.support.test.espresso.Espresso;
import android.util.Log;

import com.wix.detox.espresso.AnimatedModuleIdlingResource;
import com.wix.detox.espresso.LooperIdlingResource;
import com.wix.detox.espresso.ReactBridgeIdlingResource;
import com.wix.detox.espresso.ReactNativeNetworkIdlingResource;
import com.wix.detox.espresso.ReactNativeTimersIdlingResource;
import com.wix.detox.espresso.ReactNativeUIModuleIdlingResource;

import org.joor.Reflect;
import org.joor.ReflectException;

import java.lang.reflect.Proxy;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;

import okhttp3.OkHttpClient;

/**
 * Created by simonracz on 15/05/2017.
 */

public class ReactNativeSupport {
    private static final String LOG_TAG = "Detox";
    private static final String METHOD_GET_RN_HOST = "getReactNativeHost";
    private static final String METHOD_GET_INSTANCE_MANAGER = "getReactInstanceManager";
    private final static String METHOD_GET_CATALYST_INSTANCE = "getCatalystInstance";
    private final static String METHOD_ADD_DEBUG_BRIDGE_LISTENER = "addBridgeIdleDebugListener";
    private final static String METHOD_REMOVE_DEBUG_BRIDGE_LISTENER = "removeBridgeIdleDebugListener";
    private static final String METHOD_RECREATE_RN_CONTEXT = "recreateReactContextInBackground";
    private static final String METHOD_GET_REACT_CONTEXT = "getCurrentReactContext";
    private static final String METHOD_ADD_REACT_INSTANCE_LISTENER = "addReactInstanceEventListener";
    private static final String METHOD_REMOVE_REACT_INSTANCE_LISTENER = "removeReactInstanceEventListener";
    private static final String INTERFACE_REACT_INSTANCE_EVENT_LISTENER =
            "com.facebook.react.ReactInstanceManager$ReactInstanceEventListener";
    private static final String METHOD_HAS_STARTED_CREAT_CTX = "hasStartedCreatingInitialContext";
    private static final String METHOD_CREAT_RN_CTX_IN_BG = "createReactContextInBackground";

    private static final String INTERFACE_BRIDGE_IDLE_DEBUG_LISTENER =
            "com.facebook.react.bridge.NotThreadSafeBridgeIdleDebugListener";

    private static final String FIELD_UI_MSG_QUEUE = "mUiMessageQueueThread";
    private static final String FIELD_UI_BG_MSG_QUEUE = "mUiBackgroundMessageQueueThread";
    private static final String FIELD_NATIVE_MODULES_MSG_QUEUE = "mNativeModulesMessageQueueThread";
    private static final String FIELD_JS_MSG_QUEUE = "mJSMessageQueueThread";
    private static final String METHOD_GET_LOOPER = "getLooper";

    // Espresso has a public method to register Loopers.
    // BUT, they don't give you back a handle to them.
    // Therefore you can't unregister them.
    // We create the LooperIdlingResources by ourselves to keep a handle to them.
    // UPDATE: The reason why Espresso doesn't expose this publicly
    // is that they don't support removing Loopers at all.
    // We are using our own LooperIdlingResource currently, that
    // can be stopped properly.
    private static final String CLASS_ESPRESSO_LOOPER_IDLING_RESOURCE =
            "android.support.test.espresso.base.LooperIdlingResource";

    private ReactNativeSupport() {
        // static class
    }

    static boolean isReactNativeApp() {
        Class<?> found = null;
        try {
            found = Class.forName("com.facebook.react.ReactApplication");
        } catch (ClassNotFoundException e) {
            return false;
        }
        return (found != null);
    }

    /**
     * Returns the instanceManager using reflection.
     *
     * @param reactNativeHostHolder the object that has a getReactNativeHost() method
     * @return Returns the instanceManager as an Object or null
     */
    public static Object getInstanceManager(@NonNull Object reactNativeHostHolder) {
        Object instanceManager = null;
        try {
            instanceManager = Reflect.on(reactNativeHostHolder)
                    .call(METHOD_GET_RN_HOST)
                    .call(METHOD_GET_INSTANCE_MANAGER)
                    .get();
        } catch (ReflectException e) {
            Log.e(LOG_TAG, "Problem calling getInstanceManager()", e.getCause());
        }

        return instanceManager;
    }

    /**
     * <p>
     * Reloads the React Native application.
     * </p>
     *
     * <p>
     * It is a lot faster to reload a React Native application this way,
     * than to reload the whole Activity or Application.
     * </p>
     *
     * @param reactNativeHostHolder the object that has a getReactNativeHost() method
     */
    static void reloadApp(@NonNull Object reactNativeHostHolder) {
        if (!isReactNativeApp()) {
            return;
        }
        Log.i(LOG_TAG, "Reloading React Native");
        currentReactContext = null;

        removeEspressoIdlingResources(reactNativeHostHolder);

        final Object instanceManager = getInstanceManager(reactNativeHostHolder);
        if (instanceManager == null) {
            return;
        }

        // Must be called on the UI thread!
        InstrumentationRegistry.getInstrumentation().runOnMainSync(new Runnable() {
            @Override
            public void run() {
                try {
                    Reflect.on(instanceManager).call(METHOD_RECREATE_RN_CONTEXT);
                } catch (ReflectException e) {
                    Log.e(LOG_TAG, "Problem calling reloadApp()", e.getCause());
                }
            }
        });

        waitForReactNativeLoad(reactNativeHostHolder);
    }

    // Ideally we would not store this at all.
    public static Object currentReactContext = null;

    /**
     * <p>
     * Waits for a ReactContext to be created. Can be called any time.
     * </p>
     * @param reactNativeHostHolder the object that has a getReactNativeHost() method
     */
    static void waitForReactNativeLoad(@NonNull Object reactNativeHostHolder) {

        if (!isReactNativeApp()) {
            return;
        }

        final Object instanceManager = getInstanceManager(reactNativeHostHolder);
        if (instanceManager == null) {
            throw new RuntimeException("ReactInstanceManager is null");
        }

        final Class<?> listenerClass;
        try {
            listenerClass = Class.forName(INTERFACE_REACT_INSTANCE_EVENT_LISTENER);
        } catch (ClassNotFoundException e) {
            throw new RuntimeException("Can't find class ReactInstanceEventListener", e);
        }

        final CountDownLatch countDownLatch = new CountDownLatch(1);
        final Object[] reactContextHolder = new Object[1];
        InstrumentationRegistry.getInstrumentation().runOnMainSync(
                new Runnable() {
            @Override
            public void run() {
                reactContextHolder[0] = Reflect.on(instanceManager).call(METHOD_GET_REACT_CONTEXT).get();
                if (reactContextHolder[0] != null) {
                    Log.d(LOG_TAG, "Got reactContext directly");
                    countDownLatch.countDown();
                    return;
                }

                Class[] proxyInterfaces = new Class[]{listenerClass};
                final Proxy[] proxyHolder = new Proxy[1];
                final Delegator delegator = new Delegator(proxyInterfaces, new Object[] {new ReactInstanceEventListenerProxy() {
                    @Override
                    public void onReactContextInitialized(Object reactContext) {
                        Log.i(LOG_TAG, "Got react context through listener.");
                        reactContextHolder[0] = reactContext;
                        Reflect.on(instanceManager).call(METHOD_REMOVE_REACT_INSTANCE_LISTENER, (Object) proxyHolder[0]);
                        countDownLatch.countDown();
                    }
                }});
                proxyHolder[0] = (Proxy) Proxy.newProxyInstance(
                        listenerClass.getClassLoader(),
                        proxyInterfaces,
                        delegator);
                Reflect.on(instanceManager).call(
                        METHOD_ADD_REACT_INSTANCE_LISTENER,
                        proxyHolder[0]);
                if (!(boolean) Reflect.on(instanceManager).call(METHOD_HAS_STARTED_CREAT_CTX).get()) {
                    try {
                        Reflect.on(instanceManager).call(METHOD_CREAT_RN_CTX_IN_BG);
                    } catch (ReflectException e) {
                        Log.e(LOG_TAG, "Problem calling createReactContextInBackground()",
                                e.getCause());
                    }
                }
            }
        });

        for (int i = 0; ; ) {
            try {
                if (!countDownLatch.await(1, TimeUnit.SECONDS)) {
                    i++;
                    if (i >= 60) {
                        // First load can take a lot of time. (packager)
                        // Loads afterwards should take less than a second.
                        throw new RuntimeException("waited a minute for the new reactContext");
                    }
                } else {
                    break;
                }
                // Due to an ugly timing issue in RN
                // it is possible that our listener won't be ever called
                // That's why we have to check the reactContext regularly.
                reactContextHolder[0] = Reflect.on(instanceManager).call(METHOD_GET_REACT_CONTEXT).get();
                if (reactContextHolder[0] != null) {
                    Log.d(LOG_TAG, "Got reactContext directly");
                    break;
                }
            } catch (InterruptedException e) {
                throw new RuntimeException("waiting for reactContext got interrupted", e);
            }
        }

        currentReactContext = reactContextHolder[0];
        setupEspressoIdlingResources(reactNativeHostHolder, reactContextHolder[0]);
    }

    private static Object bridgeIdleSignaler = null;
    private static ReactBridgeIdlingResource rnBridgeIdlingResource = null;

    private static void createBridgeIdleSignaler() {
        Class<?> bridgeIdleDebugListener = null;
        try {
            bridgeIdleDebugListener = Class.forName(INTERFACE_BRIDGE_IDLE_DEBUG_LISTENER);
        } catch (ClassNotFoundException e) {
            Log.e(LOG_TAG, "Can't find ReactBridgeIdleSignaler()", e);
            return;
        }

        rnBridgeIdlingResource = new ReactBridgeIdlingResource();

        Class[] proxyInterfaces = new Class[]{bridgeIdleDebugListener};
        bridgeIdleSignaler = Proxy.newProxyInstance(
                bridgeIdleDebugListener.getClassLoader(),
                proxyInterfaces,
                new Delegator(proxyInterfaces, new Object[] { rnBridgeIdlingResource })
        );
    }

    private static ReactNativeTimersIdlingResource rnTimerIdlingResource = null;
    private static ReactNativeUIModuleIdlingResource rnUIModuleIdlingResource = null;
    private static AnimatedModuleIdlingResource animIdlingResource = null;

    private static void setupEspressoIdlingResources(
            @NonNull Object reactNativeHostHolder,
            @NonNull Object reactContext) {
        removeEspressoIdlingResources(reactNativeHostHolder, reactContext);
        Log.i(LOG_TAG, "Setting up Espresso Idling Resources for React Native.");

        setupReactNativeQueueInterrogators(reactContext);

        createBridgeIdleSignaler();
        Reflect.on(reactContext)
                .call(METHOD_GET_CATALYST_INSTANCE)
                .call(METHOD_ADD_DEBUG_BRIDGE_LISTENER, bridgeIdleSignaler);

        rnTimerIdlingResource = new ReactNativeTimersIdlingResource(reactContext);
        rnUIModuleIdlingResource = new ReactNativeUIModuleIdlingResource(reactContext);
        animIdlingResource = new AnimatedModuleIdlingResource(reactContext);

        Espresso.registerIdlingResources(
                rnTimerIdlingResource,
                rnBridgeIdlingResource,
                rnUIModuleIdlingResource,
                animIdlingResource);

        if (networkSyncEnabled) {
            setupNetworkIdlingResource();
        }
    }

    private static ArrayList<LooperIdlingResource> looperIdlingResources = new ArrayList<>();

    private static void setupReactNativeQueueInterrogators(@NonNull Object reactContext) {
        HashSet<Looper> excludedLoopers = new HashSet<>();
        excludedLoopers.add(InstrumentationRegistry.getTargetContext().getMainLooper());
        setupRNQueueInterrogator(reactContext, FIELD_UI_MSG_QUEUE, excludedLoopers);
        setupRNQueueInterrogator(reactContext, FIELD_UI_BG_MSG_QUEUE, excludedLoopers);
        setupRNQueueInterrogator(reactContext, FIELD_JS_MSG_QUEUE, excludedLoopers);
        setupRNQueueInterrogator(reactContext, FIELD_NATIVE_MODULES_MSG_QUEUE, excludedLoopers);
    }

    private static void setupRNQueueInterrogator(
            @NonNull Object reactContext,
            @NonNull String field,
            @NonNull HashSet<Looper> excludedLoopers) {
        Object queue;
        Object looper;

        try {
            if ((queue = Reflect.on(reactContext).field(field).get()) != null) {
                if ((looper = Reflect.on(queue).call(METHOD_GET_LOOPER).get()) != null) {
                    if (!excludedLoopers.contains(looper)) {
                        LooperIdlingResource looperIdlingResource = new LooperIdlingResource((Looper)looper, false);

                        looperIdlingResources.add(looperIdlingResource);
                        Espresso.registerIdlingResources(looperIdlingResource);
                        excludedLoopers.add((Looper)looper);
                    }
                }
            }
        } catch (ReflectException e) {
            // The mUiBackgroundMessageQueueThread field is stripped at runtime
            // in the current RN release.
            // We still keep trying to grab it to be future proof.
            if (!field.equals("mUiBackgroundMessageQueueThread")) {
                Log.d(LOG_TAG, "Can't set up monitoring for " + field, e);
            }
        }
    }

    static void removeEspressoIdlingResources(@NonNull Object reactNativeHostHolder) {
        Object reactContext = null;
        final Object instanceManager = getInstanceManager(reactNativeHostHolder);
        if (instanceManager != null) {
            reactContext = Reflect.on(instanceManager).call(METHOD_GET_REACT_CONTEXT).get();
        }

        removeNetworkIdlingResource();

        removeEspressoIdlingResources(reactNativeHostHolder, reactContext);
    }

    private static void removeEspressoIdlingResources(
            @NonNull Object reactNativeHostHolder,
            Object reactContext) {

        Log.i(LOG_TAG, "Removing Espresso IdlingResources for React Native.");

        if (rnBridgeIdlingResource != null
                && rnTimerIdlingResource != null
                && rnUIModuleIdlingResource != null
                && animIdlingResource != null) {
            Espresso.unregisterIdlingResources(
                    rnTimerIdlingResource,
                    rnBridgeIdlingResource,
                    rnUIModuleIdlingResource,
                    animIdlingResource);
            rnTimerIdlingResource = null;
            rnBridgeIdlingResource = null;
            rnUIModuleIdlingResource = null;
            animIdlingResource = null;
        }

        removeReactNativeQueueInterrogators();

        final Object instanceManager = getInstanceManager(reactNativeHostHolder);
        if (instanceManager == null) {
            return;
        }

        if (bridgeIdleSignaler != null) {
            if (reactContext != null) {
                Reflect.on(reactContext)
                        .call(METHOD_GET_CATALYST_INSTANCE)
                        .call(METHOD_REMOVE_DEBUG_BRIDGE_LISTENER, bridgeIdleSignaler);
            }
            bridgeIdleSignaler = null;
        }
    }

    private static void removeReactNativeQueueInterrogators() {
        for (LooperIdlingResource res : looperIdlingResources) {
            res.stop();
            Espresso.unregisterIdlingResources(res);
        }
        looperIdlingResources.clear();
    }

    private static boolean networkSyncEnabled = true;
    public static void enableNetworkSynchronization(boolean enable) {
        if (!isReactNativeApp()) return;
        if (networkSyncEnabled == enable) return;

        if (enable) {
            setupNetworkIdlingResource();
        } else {
            removeNetworkIdlingResource();
        }
        networkSyncEnabled = enable;
    }

    private static ReactNativeNetworkIdlingResource networkIR = null;
    private final static String CLASS_NETWORK_MODULE = "com.facebook.react.modules.network.NetworkingModule";
    private final static String METHOD_GET_NATIVE_MODULE = "getNativeModule";
    private final static String METHOD_HAS_NATIVE_MODULE = "hasNativeModule";
    private final static String FIELD_OKHTTP_CLIENT = "mClient";

    private static void setupNetworkIdlingResource() {
        Class<?> networkModuleClass;
        try {
            networkModuleClass = Class.forName(CLASS_NETWORK_MODULE);
        } catch (ClassNotFoundException e) {
            Log.e(LOG_TAG, "NetworkingModule is not on classpath.");
            return;
        }

        if (currentReactContext == null) {
            return;
        }

        try {
            if (!(boolean) Reflect.on(currentReactContext).call(METHOD_HAS_NATIVE_MODULE, networkModuleClass).get()) {
                Log.e(LOG_TAG, "Can't find Networking Module.");
                return;
            }

            OkHttpClient client = Reflect.on(currentReactContext)
                    .call(METHOD_GET_NATIVE_MODULE, networkModuleClass)
                    .field(FIELD_OKHTTP_CLIENT)
                    .get();
            networkIR = new ReactNativeNetworkIdlingResource(client.dispatcher());
            Espresso.registerIdlingResources(networkIR);
        } catch (ReflectException e) {
            Log.e(LOG_TAG, "Can't set up Networking Module listener", e.getCause());
        }
    }

    private static void removeNetworkIdlingResource() {
        if (networkIR != null) {
            networkIR.stop();
            Espresso.unregisterIdlingResources(networkIR);
            networkIR = null;
        }
    }


}
