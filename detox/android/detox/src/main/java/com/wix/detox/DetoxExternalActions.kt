package com.wix.detox

import android.content.Context
import java.util.*

interface ExternalAction {
    fun perform(params: String, messageId: Long)
}

class ReadyAction(
        private val wsClient: WebSocketClient,
        private val actionsFacade: ActionsFacade)
    : ExternalAction {

    override fun perform(params: String, messageId: Long) {
        actionsFacade.awaitIdle()
        wsClient.sendAction("ready", Collections.emptyMap<Any, Any>(), messageId)
    }
}

class ReactNativeReloadAction(
        private val rnContext: Context,
        private val wsClient: WebSocketClient,
        private val actionsFacade: ActionsFacade)
    : ExternalAction {

    override fun perform(params: String, messageId: Long) {
        actionsFacade.syncIdle()
        actionsFacade.reloadReactNative(rnContext)
        wsClient.sendAction("ready", Collections.emptyMap<Any, Any>(), messageId)
    }
}
