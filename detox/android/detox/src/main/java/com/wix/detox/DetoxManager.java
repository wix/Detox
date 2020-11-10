package com.wix.detox;

import android.content.Context;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;

import com.wix.detox.instruments.DetoxInstrumentsManager;
import com.wix.detox.reactnative.ReactNativeExtension;
import com.wix.invoke.MethodInvocation;

import java.util.HashMap;
import java.util.Map;

import androidx.annotation.NonNull;
import androidx.test.platform.app.InstrumentationRegistry;
import kotlin.Unit;
import kotlin.jvm.functions.Function0;
import kotlin.jvm.functions.Function1;

/**
 * Created by rotemm on 04/01/2017.
 */
class DetoxManager implements WebSocketClient.ActionHandler {

    private final static String LOG_TAG =  "DetoxManager";

    private final static String DETOX_SERVER_ARG_KEY = "detoxServer";
    private final static String DETOX_SESSION_ID_ARG_KEY = "detoxSessionId";

    private final static Function1<Throwable, String> errorParseFn = new Function1<Throwable, String>() {
        @Override
        public String invoke(Throwable t) {
            return Log.getStackTraceString(t);
        }
    };

    private String detoxServerUrl;
    private String detoxSessionId;

    private WebSocketClient wsClient;
    private Handler handler;

    private TestEngineFacade testEngineFacade = new TestEngineFacade();
    private Map<String, DetoxActionHandler> actionHandlers = new HashMap<>();
    private ReadyActionHandler readyActionHandler = null;

    private Context reactNativeHostHolder;

    DetoxManager(@NonNull Context context) {
        this.reactNativeHostHolder = context;

        handler = new Handler();

        Bundle arguments = InstrumentationRegistry.getArguments();
        detoxServerUrl = arguments.getString(DETOX_SERVER_ARG_KEY);
        detoxSessionId = arguments.getString(DETOX_SESSION_ID_ARG_KEY);

        if (detoxServerUrl == null || detoxSessionId == null) {
            Log.i(LOG_TAG, "Missing arguments : detoxServer and/or detoxSession. Detox quits.");
            stop();
            return;
        }

        Log.i(LOG_TAG, "DetoxServerUrl: " + detoxServerUrl);
        Log.i(LOG_TAG, "DetoxSessionId: " + detoxSessionId);
    }

    void start() {
        if (detoxServerUrl != null && detoxSessionId != null) {
            handler.post(new Runnable() {
                @Override
                public void run() {
                    initReactNativeIfNeeded();
                    initWSClient();
                    initCrashHandler();
                    initANRListener();
                    initActionHandlers();
                }
            });
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

                testEngineFacade.resetReactNative();

                actionHandlers.clear();
                readyActionHandler = null;

                if (wsClient != null) {
                    wsClient.close();
                }
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
                final DetoxActionHandler handler = actionHandlers.get(type);
                if (handler != null) {
                    handler.handle(params, messageId);
                }
            }
        });
    }

    @Override
    public void onConnect() {
        readyActionHandler.handle("", -1000L);
    }

    @Override
    public void onClosed() {
        stop();
    }

    private void initReactNativeIfNeeded() {
        ReactNativeExtension.waitForRNBootstrap(reactNativeHostHolder);
    }

    private void initWSClient() {
        wsClient = new WebSocketClient(this);
        wsClient.connectToServer(detoxServerUrl, detoxSessionId);
    }

    private void initCrashHandler() {
        new DetoxCrashHandler(wsClient).attach();
    }

    private void initANRListener() {
        new DetoxANRHandler(wsClient).attach();
    }

    private void initActionHandlers() {
        readyActionHandler = new ReadyActionHandler(wsClient, testEngineFacade);
        actionHandlers.clear();
        actionHandlers.put("isReady", readyActionHandler);
        actionHandlers.put("reactNativeReload", new ReactNativeReloadActionHandler(reactNativeHostHolder, wsClient, testEngineFacade));
        actionHandlers.put("currentStatus", new QueryStatusActionHandler(wsClient, testEngineFacade));
        actionHandlers.put("invoke", new InvokeActionHandler(new MethodInvocation(), wsClient, errorParseFn));
        actionHandlers.put("cleanup", new CleanupActionHandler(wsClient, testEngineFacade, new Function0<Unit>() {
            @Override
            public Unit invoke() {
                stop();
                return null;
            }
        }));

        if (DetoxInstrumentsManager.supports()) {
            final DetoxInstrumentsManager instrumentsManager = new DetoxInstrumentsManager(reactNativeHostHolder);
            actionHandlers.put("setRecordingState", new InstrumentsRecordingStateActionHandler(instrumentsManager, wsClient));
            actionHandlers.put("event", new InstrumentsEventsActionsHandler(instrumentsManager, wsClient));
        }
    }
}
