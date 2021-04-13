package com.wix.detox.adapters.server;

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

    private static final String LOG_TAG = "DetoxWSClient";

    private volatile boolean closing = false;

    public void close() {
        if (closing) return;
        closing = true;
        websocket.close(NORMAL_CLOSURE_STATUS, null);
    }

    private String url;
    private String sessionId;
    private WebSocket websocket = null;

    private final WSEventsHandler wsEventsHandler;
    private final WebSocketEventsListener wsEventListener = new WebSocketEventsListener();

    private static final int NORMAL_CLOSURE_STATUS = 1000;

    public WebSocketClient(WSEventsHandler wsEventsHandler) {
        this.wsEventsHandler = wsEventsHandler;
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
        this.websocket = client.newWebSocket(request, wsEventListener);

        client.dispatcher().executorService().shutdown();
    }

    public void sendAction(String type, Map params, Long messageId) {
        Log.i(LOG_TAG, "Sending out action '" + type + "' (ID #" + messageId + ")");

        final Map<String, Object> data = new HashMap<>();
        data.put("type", type);
        data.put("params", params);
        data.put("messageId", messageId);

        final JSONObject json = new JSONObject(data);
        websocket.send(json.toString());
    }

    private void receiveAction(String json) {
        try {
            final JSONObject object = new JSONObject(json);
            final String type = (String) object.get("type");
            final Object params = object.get("params");
            final long messageId = object.getLong("messageId");

            Log.d(LOG_TAG, "Received action '" + type + "' (ID #" + messageId + ", params=" + params + ")");

            if (wsEventsHandler != null) {
                wsEventsHandler.onAction(type, params.toString(), messageId);
            }
        } catch (JSONException e) {
            Log.e(LOG_TAG, "Detox Error: receiveAction decode - " + e.toString());
        }
    }

    /**
     * These methods are called on an inner worker thread.
     * @see <a href="https://medium.com/@jakewharton/listener-messages-are-called-on-a-background-thread-since-okhttp-is-agnostic-with-respect-to-5fdc5182e240">OkHTTP</a>
     */
    public interface WSEventsHandler {
        void onAction(String type, String params, long messageId);
        void onConnect();
        void onClosed();
    }

    private class WebSocketEventsListener extends WebSocketListener {
        @Override
        public void onOpen(WebSocket webSocket, Response response) {
            Log.d(LOG_TAG, "At onOpen");

            Map<String, Object> params = new HashMap<>();
            params.put("sessionId", sessionId);
            params.put("role", "app");
            sendAction("login", params, 0L);
            wsEventsHandler.onConnect();
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
            receiveAction(text);
        }

        @Override
        public void onMessage(WebSocket webSocket, ByteString bytes) {
            Log.e(LOG_TAG, "Unexpected binary ws message from detox server.");
        }

        @Override
        public void onClosed(WebSocket webSocket, int code, String reason) {
            closing = true;
            wsEventsHandler.onClosed();
        }

        @Override
        public void onClosing(WebSocket webSocket, int code, String reason) {
            closing = true;
            websocket.close(NORMAL_CLOSURE_STATUS, null);
        }
    }
}
