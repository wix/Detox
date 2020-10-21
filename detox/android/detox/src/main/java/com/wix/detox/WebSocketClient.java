package com.wix.detox;

import android.util.Log;

import org.json.JSONException;
import org.json.JSONObject;

import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.TimeUnit;

import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.Response;
import okhttp3.WebSocket;
import okhttp3.WebSocketListener;
import okio.ByteString;

public class WebSocketClient {

    private volatile boolean closing = false;

    public void close() {
        if (closing) return;
        closing = true;
        websocket.close(NORMAL_CLOSURE_STATUS, null);
    }

    private static final String LOG_TAG = "WebSocketClient";

    private String url;
    private String sessionId;
    private WebSocket websocket = null;

    private final ActionHandler actionHandler;
    private final WebSocketEventsHandler wsEventsHandler = new WebSocketEventsHandler();

    private static final int NORMAL_CLOSURE_STATUS = 1000;

    public WebSocketClient(ActionHandler actionHandler) {
        this.actionHandler = actionHandler;
    }

    public void connectToServer(String url, String sessionId) {
        Log.i(LOG_TAG, "At connectToServer");

        this.url = url;
        this.sessionId = sessionId;

        final OkHttpClient client = new OkHttpClient.Builder()
                .retryOnConnectionFailure(true)
                .connectTimeout(1500, TimeUnit.MILLISECONDS)
                .readTimeout(0, TimeUnit.MILLISECONDS)
                .build();

        final Request request = new Request.Builder().url(url).build();
        this.websocket = client.newWebSocket(request, wsEventsHandler);

        client.dispatcher().executorService().shutdown();
    }

    public void sendAction(String type, Map params, Long messageId) {
        Log.i(LOG_TAG, "At sendAction");

        final Map<String, Object> data = new HashMap<>();
        data.put("type", type);
        data.put("params", params);
        data.put("messageId", messageId);

        final JSONObject json = new JSONObject(data);
        websocket.send(json.toString());
        Log.d(LOG_TAG, "Detox Action Sent: " + type);
    }

    private void receiveAction(String json) {
        Log.i(LOG_TAG, "At receiveAction");
        try {
            final JSONObject object = new JSONObject(json);
            final String type = (String) object.get("type");
            final Object params = object.get("params");
            final long messageId = object.getLong("messageId");

            Log.d(LOG_TAG, "Detox Action Received: " + type);

            if (actionHandler != null) {
                actionHandler.onAction(type, params.toString(), messageId);
            }
        } catch (JSONException e) {
            Log.e(LOG_TAG, "Detox Error: receiveAction decode - " + e.toString());
        }
    }

    /**
     * These methods are called on an inner worker thread.
     * @see <a href="https://medium.com/@jakewharton/listener-messages-are-called-on-a-background-thread-since-okhttp-is-agnostic-with-respect-to-5fdc5182e240">OkHTTP</a>
     */
    public interface ActionHandler {
        void onAction(String type, String params, long messageId);
        void onConnect();
        void onClosed();
    }

    private class WebSocketEventsHandler extends WebSocketListener {
        @Override
        public void onOpen(WebSocket webSocket, Response response) {
            Log.i(LOG_TAG, "At onOpen");

            Map<String, Object> params = new HashMap<>();
            params.put("sessionId", sessionId);
            params.put("role", "testee");
            sendAction("login", params, 0L);
            actionHandler.onConnect();
        }

        @Override
        public void onFailure(WebSocket webSocket, Throwable t, Response response) {
//        Log.e(LOG_TAG, "Detox Error: ", t);

            //OKHttp won't recover from failure if it got ConnectException,
            // this is a workaround to make the websocket client try reconnecting when failed.
            try {
                Thread.sleep(3000);
            } catch (InterruptedException e2) {
                Log.d(LOG_TAG, "interrupted", e2);
            }
            Log.d(LOG_TAG, "Retrying...");
            connectToServer(url, sessionId);
        }

        @Override
        public void onMessage(WebSocket webSocket, String text) {
            Log.i(LOG_TAG, "At onMessage");
            receiveAction(text);
        }

        @Override
        public void onMessage(WebSocket webSocket, ByteString bytes) {
            Log.e(LOG_TAG, "Unexpected binary ws message from detox server.");
        }

        @Override
        public void onClosed(WebSocket webSocket, int code, String reason) {
            Log.d(LOG_TAG, "Detox WS Closed: " + code + " " + reason);
            closing = true;
            actionHandler.onClosed();
        }

        @Override
        public void onClosing(WebSocket webSocket, int code, String reason) {
            Log.i(LOG_TAG, "At onClosing");
            closing = true;
            websocket.close(NORMAL_CLOSURE_STATUS, null);
        }
    }
}
