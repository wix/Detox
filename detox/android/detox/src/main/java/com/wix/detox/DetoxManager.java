package com.wix.detox;

import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.support.annotation.NonNull;
import android.support.test.InstrumentationRegistry;
import android.util.Log;

import java.util.Collections;
import java.util.Map;

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
        detoxServerUrl = arguments.getString(DETOX_SERVER_ARG_KEY);
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
        handler.post(new Runnable() {
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
    public void onAction(final String type, Map params) {
        Log.i(LOG_TAG, "onAction: type: " + type + " params: " + params);
        handler.post(new Runnable() {
            @Override
            public void run() {
                switch (type) {
                    case "invoke":
                        /*
                        try {
                            Espresso.onView(withTagValue(is((Object)"hello_button"))).check(matches(isDisplayed()));
                        } catch (RuntimeException e) {
                            if (e instanceof EspressoException) {
                                Log.i(LOG_TAG, "Test exception", e);
                            } else {
                                Log.e(LOG_TAG, "Exception", e);
                            }
                            stop();
                        }
                        */
                        break;
                    case "stop":
                        stop();
                        break;
                    case "isReady":
                        wsClient.sendAction("ready", Collections.emptyMap());
                        break;
                    case "cleanup":
                        wsClient.sendAction("cleanupDone", Collections.emptyMap());
                        break;
                    case "reactNativeReload":
                        ReactNativeSupport.reloadApp(reactNativeHostHolder);
                        break;
                }
            }
        });
    }

    @Override
    public void onConnect() {
        wsClient.sendAction("ready", Collections.emptyMap());
    }

    @Override
    public void onClosed() {
        stop();
    }
}
