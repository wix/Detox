package com.wix.detox;

import android.os.Looper;
import android.util.Log;

import java.util.Collections;
import java.util.Map;

/**
 * Created by rotemm on 04/01/2017.
 */

public class DetoxManager implements WebSocketClient.ActionHandler {

    private static final String LOG_TAG =  "DetoxManager";
    private WebSocketClient client;
    private TestRunner testRunner;
    private Looper looper;

    public DetoxManager() {

        Looper.prepare();

        testRunner = new TestRunner();
        connectToServer();

        looper = Looper.myLooper();
        Looper.loop();
    }

    private void connectToServer() {
        client = new WebSocketClient(this);
        client.connectToServer("test");
    }


    @Override
    public void onAction(String type, Map params) {
        Log.d(LOG_TAG, "onAction: type: " + type + " params: " + params);
        switch (type) {
            case "invoke":
                break;
            case "isReady":
                break;
            case "cleanup":
                break;
        }

    }

    @Override
    public void onConnect() {
        client.sendAction("ready", Collections.emptyMap());
    }

    @Override
    public void onClosed() {
        if (looper != null) {
            looper.quit();
        }
    }
}
