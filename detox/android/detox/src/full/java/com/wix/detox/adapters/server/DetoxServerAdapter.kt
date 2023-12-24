package com.wix.detox.adapters.server

import android.util.Log
import com.wix.detox.common.DetoxLog

interface OutboundServerAdapter {
    fun sendMessage(type: String, payload: Map<String, Any?>, id: Long)
}

class DetoxServerAdapter(
        private val actionsDispatcher: DetoxActionsDispatcher,
        private val detoxServerInfo: DetoxServerInfo,
        private val terminationActionType: String)
    : WebSocketClient.WSEventsHandler, OutboundServerAdapter {

    private val wsClient = WebSocketClient(this)

    fun connect() {
        Log.i(DetoxLog.LOG_TAG, "Connecting to server...")
        wsClient.connectToServer(detoxServerInfo.serverUrl, detoxServerInfo.sessionId)
    }

    fun teardown() {
        wsClient.close()
    }

    override fun onConnect() {
        Log.i(DetoxLog.LOG_TAG, "Connected to server!")
    }

    override fun onClosed() {
        Log.i(DetoxLog.LOG_TAG, "Disconnected from server")
        actionsDispatcher.dispatchAction(terminationActionType, "", 0)
    }

    override fun onAction(type: String, params: String, messageId: Long) {
        actionsDispatcher.dispatchAction(type, params, messageId)
    }

    override fun sendMessage(type: String, payload: Map<String, Any?>, id: Long)
            = wsClient.sendAction(type, payload, id)
}
