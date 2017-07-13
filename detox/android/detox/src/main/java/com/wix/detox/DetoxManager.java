package com.wix.detox;

import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.support.annotation.NonNull;
import android.support.test.InstrumentationRegistry;
import android.support.test.espresso.Espresso;
import android.support.test.espresso.EspressoException;
import android.util.Log;

import com.wix.detox.systeminfo.Environment;
import com.wix.invoke.MethodInvocation;

import java.util.Collections;

import static android.support.test.espresso.action.ViewActions.click;
import static android.support.test.espresso.assertion.ViewAssertions.matches;
import static android.support.test.espresso.matcher.ViewMatchers.isDisplayed;
import static android.support.test.espresso.matcher.ViewMatchers.withTagValue;
import static android.support.test.espresso.matcher.ViewMatchers.withText;
import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.not;


/**
 * Created by rotemm on 04/01/2017.
 */

class DetoxManager implements WebSocketClient.ActionHandler {

    private static final String LOG_TAG =  "DetoxManager";

    private final static String DETOX_SERVER_ARG_KEY = "detoxServer";
    private final static String DETOX_SESSION_ID_ARG_KEY = "detoxSessionId";
    private String detoxServerUrl = null;
    private String detoxSessionId = null;

    private WebSocketClient wsClient;
    // private TestRunner testRunner;
    private Handler handler;

    private Object reactNativeHostHolder = null;

    DetoxManager(@NonNull Object reactNativeHostHolder) {
        this.reactNativeHostHolder = reactNativeHostHolder;
        handler = new Handler();

        Bundle arguments = InstrumentationRegistry.getArguments();
        detoxServerUrl = arguments.getString(DETOX_SERVER_ARG_KEY).replace(Environment.DEVICE_LOCALHOST, Environment.getServerHost());
        detoxSessionId = arguments.getString(DETOX_SESSION_ID_ARG_KEY);

        if (detoxServerUrl == null || detoxSessionId == null) {
            Log.i(LOG_TAG, "Missing arguments : detoxServer and/or detoxSession. Detox quits.");
            stop();
            return;
        }

        Log.i(LOG_TAG, "DetoxServerUrl : " + detoxServerUrl);
        Log.i(LOG_TAG, "DetoxSessionId : " + detoxSessionId);
    }

    void start() {
        if (detoxServerUrl != null && detoxSessionId != null) {
            if (ReactNativeSupport.isReactNativeApp()) {
                ReactNativeSupport.waitForReactNativeLoad(reactNativeHostHolder);
            }
            // testRunner = new TestRunner(this);
            wsClient = new WebSocketClient(this);
            wsClient.connectToServer(detoxServerUrl, detoxSessionId);
        }
    }

    void stop() {
        Log.i(LOG_TAG, "Stopping Detox.");
        handler.postAtFrontOfQueue(new Runnable() {
            @Override
            public void run() {
                // TODO
                // Close the websocket
                ReactNativeSupport.removeEspressoIdlingResources(reactNativeHostHolder);
                Looper.myLooper().quit();
            }
        });
    }

    @Override
    public void onAction(final String type, final String params, final long messageId) {
        Log.i(LOG_TAG, "onAction: type: " + type + " params: " + params);
        handler.post(new Runnable() {
            @Override
            public void run() {
                switch (type) {
                    case "invoke":
                        try {
                            Object retVal = MethodInvocation.invoke(params);
                            Log.d(LOG_TAG, "Invocation result: " + retVal);
                        } catch (Exception ex) {
                            Log.d(LOG_TAG, "Invocation failed: " + ex.toString());
                        }
                        break;
                    case "isReady":
                        // It's always ready, because reload, waitForRn are both synchronous.
                        wsClient.sendAction("ready", Collections.emptyMap(), messageId);
                        break;
                    case "cleanup":
                        wsClient.sendAction("cleanupDone", Collections.emptyMap(), messageId);
                        stop();
                        break;
                    case "reactNativeReload":
                        ReactNativeSupport.reloadApp(reactNativeHostHolder);
                        wsClient.sendAction("ready", Collections.emptyMap(), messageId);
                        break;
                    // TODO
                    // Remove these test* commands later.
                    case "testInvoke1":
                        try {
                            Espresso.onView(withTagValue(is((Object)"hello_button"))).check(matches(isDisplayed()));
                        } catch (RuntimeException e) {
                            if (e instanceof EspressoException) {
                                Log.i(LOG_TAG, "Test exception", e);
                                wsClient.sendAction("TEST_FAIL", Collections.emptyMap(), messageId);
                            } else {
                                wsClient.sendAction("EXCEPTION", Collections.emptyMap(), messageId);
                                Log.e(LOG_TAG, "Exception", e);
                            }
                            stop();
                            break;
                        }
                        wsClient.sendAction("TEST_OK", Collections.emptyMap(), messageId);
                        break;
                    case "testInvokeNeg1":
                        try {
                            Espresso.onView(withTagValue(is((Object)"hello_button"))).check(matches(not(isDisplayed())));
                        } catch (RuntimeException e) {
                            if (e instanceof EspressoException) {
                                Log.i(LOG_TAG, "Test exception", e);
                                wsClient.sendAction("TEST_FAIL", Collections.emptyMap(), messageId);
                            } else {
                                wsClient.sendAction("EXCEPTION", Collections.emptyMap(), messageId);
                                Log.e(LOG_TAG, "Exception", e);
                            }
                            stop();
                            break;
                        }
                        wsClient.sendAction("TEST_OK", Collections.emptyMap(), messageId);
                        break;
                    case "testPush":
                        Espresso.onView(withTagValue(is((Object) "hello_button"))).perform(click());
                        break;
                    case "testInvoke2":
                        try {
                            Espresso.onView(withText("Hello!!!")).check(matches(isDisplayed()));
                        } catch (RuntimeException e) {
                            if (e instanceof EspressoException) {
                                Log.i(LOG_TAG, "Test exception", e);
                                wsClient.sendAction("TEST_FAIL", Collections.emptyMap(), messageId);
                            } else {
                                wsClient.sendAction("EXCEPTION", Collections.emptyMap(), messageId);
                                Log.e(LOG_TAG, "Exception", e);
                            }
                            stop();
                            break;
                        }
                        wsClient.sendAction("TEST_OK", Collections.emptyMap(), messageId);
                        break;
                }
            }
        });
    }

    @Override
    public void onConnect() {
        wsClient.sendAction("ready", Collections.emptyMap(), -1000L);
    }

    @Override
    public void onClosed() {
        stop();
    }
}
