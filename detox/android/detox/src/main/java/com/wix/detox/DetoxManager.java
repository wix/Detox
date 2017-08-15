package com.wix.detox;

import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.support.annotation.NonNull;
import android.support.test.InstrumentationRegistry;
import android.util.Log;

import com.wix.detox.espresso.UiAutomatorHelper;
import com.wix.detox.systeminfo.Environment;
import com.wix.invoke.MethodInvocation;

import org.json.JSONException;
import org.json.JSONObject;

import java.lang.reflect.InvocationTargetException;
import java.util.Collections;
import java.util.HashMap;


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
    private Handler handler;

    private Object reactNativeHostHolder = null;

    DetoxManager(@NonNull Object reactNativeHostHolder) {
        this.reactNativeHostHolder = reactNativeHostHolder;
        handler = new Handler();

        Bundle arguments = InstrumentationRegistry.getArguments();
        detoxServerUrl = arguments.getString(DETOX_SERVER_ARG_KEY);
        if (detoxServerUrl != null) {
            detoxServerUrl = detoxServerUrl.replace(Environment.DEVICE_LOCALHOST, Environment.getServerHost());
        }
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

            wsClient = new WebSocketClient(this);
            wsClient.connectToServer(detoxServerUrl, detoxSessionId);
        }
    }

    boolean stopping = false;

    void stop() {
        Log.i(LOG_TAG, "Stopping Detox.");
        handler.postAtFrontOfQueue(new Runnable() {
            @Override
            public void run() {
                if (stopping) return;
                stopping = true;
                ReactNativeSupport.removeEspressoIdlingResources(reactNativeHostHolder);
                wsClient.close();
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
                            String retStr = "(null)";
                            if (retVal != null) {
                                // TODO
                                // handle supported return types
                            }
                            HashMap m = new HashMap();
                            m.put("result", retStr);
                            wsClient.sendAction("invokeResult", m, messageId);
                        } catch (InvocationTargetException e) {
                                Log.e(LOG_TAG, "Exception", e);
                                HashMap m = new HashMap();
                                m.put("error", e.getTargetException().getMessage());
                                wsClient.sendAction("error", m, messageId);
                        } catch (Exception e) {
                            Log.i(LOG_TAG, "Test exception", e);
                            HashMap m = new HashMap();
                            m.put("details", e.getMessage());
                            wsClient.sendAction("testFailed", m, messageId);
                        }
                        break;
                    case "isReady":
                        // It's always ready, because reload, waitForRn are both synchronous.
                        wsClient.sendAction("ready", Collections.emptyMap(), messageId);
                        break;
                    case "cleanup":
                        wsClient.sendAction("cleanupDone", Collections.emptyMap(), messageId);
                        try {
                            boolean stopRunner = new JSONObject(params).getBoolean("stopRunner");
                            if (stopRunner) {
                                stop();
                            } else {
                                ReactNativeSupport.removeEspressoIdlingResources(reactNativeHostHolder);
                            }
                        } catch (JSONException e) {
                            Log.e(LOG_TAG, "cleanup cmd doesn't have stopRunner param");
                        }
                        break;
                    case "reactNativeReload":
                        UiAutomatorHelper.espressoSync();
                        ReactNativeSupport.reloadApp(reactNativeHostHolder);
                        wsClient.sendAction("ready", Collections.emptyMap(), messageId);
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
