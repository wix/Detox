package com.wix.detox;

import android.util.Log;

import org.json.JSONException;
import org.json.JSONObject;

import java.util.HashMap;
import java.util.concurrent.TimeUnit;

import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.Response;
import okhttp3.WebSocket;
import okhttp3.WebSocketListener;
import okio.ByteString;

/**
 * Created by rotemm on 27/12/2016.
 */

public class WebSocketClient extends WebSocketListener {

    private static final String LOG_TAG = "WebSocketClient";

    private String sessionId;
    private OkHttpClient client;

    public void connectToServer(String url, String sessionId) {
        this.sessionId = sessionId;

        client = new OkHttpClient.Builder().readTimeout(0, TimeUnit.MILLISECONDS).build();
        Request request = new Request.Builder().url(url).build();
        client.newWebSocket(request, this);
        client.dispatcher().executorService().shutdown();
    }

    public void sendAction(WebSocket webSocket, String type, HashMap params) {
        HashMap data = new HashMap();
        data.put("type", type);
        data.put("params", params);

        JSONObject json = new JSONObject(data);
        webSocket.send(json.toString());
        Log.d(LOG_TAG, "Detox Action Sent: " + type);
    }

    public void receiveAction(WebSocket webSocket,  String json) {
        try {
            JSONObject object = new JSONObject(json);

            String type = (String) object.get("type");
            if(type == null) {
                Log.e(LOG_TAG, "Detox Error: receiveAction missing type");
                return;
            }

            Object params = object.get("params");
            if (params != null && !(params instanceof Object)) {
                Log.d(LOG_TAG, "Detox Error: receiveAction invalid params");
            }

            Log.d(LOG_TAG, "Detox Action Received: " + type);
        } catch (JSONException e) {
            Log.e(LOG_TAG, "Detox Error: receiveAction decode - " + e.toString());
        }

    }

    @Override
    public void onOpen(WebSocket webSocket, Response response) {
        HashMap params = new HashMap();
        params.put("sessionId", sessionId);
        params.put("role", "testee");
        sendAction(webSocket, "login", params);
    }

    @Override
    public void onMessage(WebSocket webSocket, String text) {
        receiveAction(webSocket, text);
    }

    @Override
    public void onMessage(WebSocket webSocket, ByteString bytes) {

    }

    @Override
    public void onClosing(WebSocket webSocket, int code, String reason) {
        webSocket.close(1000, null);
        Log.d(LOG_TAG, "Detox Closed: " + code + " " + reason);
    }

    @Override
    public void onFailure(WebSocket webSocket, Throwable t, Response response) {
        Log.e(LOG_TAG, "Detox Error: ", t);
    }
}