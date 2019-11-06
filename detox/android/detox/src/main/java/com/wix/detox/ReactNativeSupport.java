package com.wix.detox;

import android.content.Context;
import android.os.Looper;
import android.util.Log;

import com.facebook.react.ReactApplication;
import com.facebook.react.ReactInstanceManager;
import com.facebook.react.bridge.ReactContext;
import com.wix.detox.espresso.AnimatedModuleIdlingResource;
import com.wix.detox.espresso.ReactBridgeIdlingResource;
import com.wix.detox.espresso.ReactNativeNetworkIdlingResource;
import com.wix.detox.espresso.ReactNativeTimersIdlingResource;
import com.wix.detox.espresso.ReactNativeUIModuleIdlingResource;
import com.wix.detox.reactnative.ReactNativeLoadingMonitor;
import com.wix.detox.reactnative.ReactNativeReLoader;

import org.joor.Reflect;
import org.joor.ReflectException;

import androidx.annotation.NonNull;
import androidx.test.espresso.IdlingRegistry;
import androidx.test.espresso.base.IdlingResourceRegistry;
import androidx.test.platform.app.InstrumentationRegistry;
import okhttp3.OkHttpClient;


/**
 * Created by simonracz on 15/05/2017.
 */

//TODO Dear reader, if you get this far and find this class messy you are not alone. :) It needs a refactor.

public class ReactNativeSupport {
    private static final String LOG_TAG = "DetoxRNSupport";

    private static final String FIELD_UI_BG_MSG_QUEUE = "mUiBackgroundMessageQueueThread";
    private static final String FIELD_NATIVE_MODULES_MSG_QUEUE = "mNativeModulesMessageQueueThread";
    private static final String FIELD_JS_MSG_QUEUE = "mJSMessageQueueThread";
    private static final String METHOD_GET_LOOPER = "getLooper";

    // Ideally we would not store this at all.
    public static ReactContext currentReactContext = null;

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
    static void reloadApp(@NonNull Context reactNativeHostHolder) {
        if (!isReactNativeApp()) {
            return;
        }

        Log.i(LOG_TAG, "Reloading React Native");
        currentReactContext = null;

        removeEspressoIdlingResources(reactNativeHostHolder);

        final ReactInstanceManager instanceManager = getInstanceManagerSafe(reactNativeHostHolder);
        final ReactContext previousReactContext = instanceManager.getCurrentReactContext();
        final ReactNativeReLoader rnReloader = new ReactNativeReLoader(InstrumentationRegistry.getInstrumentation(), (ReactApplication) reactNativeHostHolder);
        final ReactNativeLoadingMonitor rnLoadingMonitor = new ReactNativeLoadingMonitor(InstrumentationRegistry.getInstrumentation(), (ReactApplication) reactNativeHostHolder, previousReactContext);

        rnReloader.reloadInBackground();
        currentReactContext = rnLoadingMonitor.getNewContext();
        setupEspressoIdlingResources(currentReactContext);
        hackRN50OrHigherWaitForReady();
    }

    /**
     * Waits for a ReactContext to be created.

     * @param reactNativeHostHolder the object that has a getReactNativeHost() method
     */
    static void waitForReactNativeLoad(@NonNull Context reactNativeHostHolder) {
        if (!isReactNativeApp()) {
            return;
        }

        ReactNativeLoadingMonitor rnLoadingMonitor = new ReactNativeLoadingMonitor(InstrumentationRegistry.getInstrumentation(), (ReactApplication) reactNativeHostHolder, null);
        currentReactContext = rnLoadingMonitor.getNewContext();
        setupEspressoIdlingResources(currentReactContext);
        hackRN50OrHigherWaitForReady();
    }

    private static void hackRN50OrHigherWaitForReady() {
        if (ReactNativeCompat.getMinor() >= 50) {
            try {
                //TODO- Temp hack to make Detox usable for RN>=50 till we find a better sync solution.
                Thread.sleep(1000);
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
        }
    }

    private static ReactInstanceManager getInstanceManager(@NonNull Context context) {
        return ((ReactApplication) context).getReactNativeHost().getReactInstanceManager();
    }

    private static ReactInstanceManager getInstanceManagerSafe(@NonNull Context context) {
        ReactInstanceManager reactInstanceManager = ((ReactApplication) context).getReactNativeHost().getReactInstanceManager();
        if (reactInstanceManager == null) {
            throw new RuntimeException("ReactInstanceManager is null!");
        }
        return reactInstanceManager;
    }

    private static ReactNativeTimersIdlingResource rnTimerIdlingResource = null;
    private static ReactBridgeIdlingResource rnBridgeIdlingResource = null;
    private static ReactNativeUIModuleIdlingResource rnUIModuleIdlingResource = null;
    private static AnimatedModuleIdlingResource animIdlingResource = null;

    private static void setupEspressoIdlingResources(@NonNull ReactContext reactContext) {
        removeEspressoIdlingResources(reactContext);
        Log.i(LOG_TAG, "Setting up Espresso Idling Resources for React Native.");

        setupReactNativeQueueInterrogators(reactContext);

        rnBridgeIdlingResource = new ReactBridgeIdlingResource(reactContext);
        rnTimerIdlingResource = new ReactNativeTimersIdlingResource(reactContext);
        rnUIModuleIdlingResource = new ReactNativeUIModuleIdlingResource(reactContext);
        animIdlingResource = new AnimatedModuleIdlingResource(reactContext);

        IdlingRegistry.getInstance().register(rnTimerIdlingResource);
        IdlingRegistry.getInstance().register(rnBridgeIdlingResource);
        IdlingRegistry.getInstance().register(rnUIModuleIdlingResource);
        IdlingRegistry.getInstance().register(animIdlingResource);

        if (networkSyncEnabled) {
            setupNetworkIdlingResource();
        }
    }

    private static void setupReactNativeQueueInterrogators(@NonNull Object reactContext) {
        Looper UIBackgroundMessageQueue = getLooperFromQueue(reactContext, FIELD_UI_BG_MSG_QUEUE);
        Looper JSMessageQueue = getLooperFromQueue(reactContext, FIELD_JS_MSG_QUEUE);
        Looper JMativeModulesMessageQueue = getLooperFromQueue(reactContext, FIELD_NATIVE_MODULES_MSG_QUEUE);

//        IdlingRegistry.getInstance().registerLooperAsIdlingResource(UIBackgroundMessageQueue);
        IdlingRegistry.getInstance().registerLooperAsIdlingResource(JSMessageQueue);
        IdlingRegistry.getInstance().registerLooperAsIdlingResource(JMativeModulesMessageQueue);

        IdlingResourceRegistry irr = Reflect.on(androidx.test.espresso.Espresso.class).field("baseRegistry").get();
        irr.sync(IdlingRegistry.getInstance().getResources(), IdlingRegistry.getInstance().getLoopers());
    }

    private static Looper getLooperFromQueue(@NonNull Object reactContext, String queueName) {
        Object queue;
        Looper looper = null;

        try {
            queue = Reflect.on(reactContext).field(queueName).get();
            if (queue != null) {
                looper = Reflect.on(queue).call(METHOD_GET_LOOPER).get();
            }
        } catch (ReflectException e) {
            Log.e(LOG_TAG, "Could not find looper queue: " + queueName, e.getCause());
            return null;
        }
        return looper;
    }

    static void removeEspressoIdlingResources(@NonNull Context reactNativeHostHolder) {
        final ReactInstanceManager instanceManager = getInstanceManager(reactNativeHostHolder);
        removeNetworkIdlingResource();
        removeEspressoIdlingResources(instanceManager.getCurrentReactContext());
    }

    private static void removeEspressoIdlingResources(ReactContext reactContext) {

        Log.i(LOG_TAG, "Removing Espresso IdlingResources for React Native.");

        IdlingRegistry.getInstance().unregister(rnTimerIdlingResource);
        IdlingRegistry.getInstance().unregister(rnBridgeIdlingResource);
        IdlingRegistry.getInstance().unregister(rnUIModuleIdlingResource);
        IdlingRegistry.getInstance().unregister(animIdlingResource);

        reactContext.getCatalystInstance().removeBridgeIdleDebugListener(rnBridgeIdlingResource);
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
            IdlingRegistry.getInstance().register(networkIR);

        } catch (ReflectException e) {
            Log.e(LOG_TAG, "Can't set up Networking Module listener", e.getCause());
        }
    }

    private static void removeNetworkIdlingResource() {
        if (networkIR != null) {
            networkIR.stop();
            IdlingRegistry.getInstance().unregister(networkIR);
            networkIR = null;
        }
    }

    public static void pauseRNTimersIdlingResource() {
        if (rnTimerIdlingResource != null) {
            rnTimerIdlingResource.pause();
        }
    }

    public static void resumeRNTimersIdlingResource() {
        rnTimerIdlingResource.resume();
    }
}
