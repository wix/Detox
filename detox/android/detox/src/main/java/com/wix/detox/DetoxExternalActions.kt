package com.wix.detox

import android.support.test.espresso.Espresso
import java.util.*

class TestHelper {
    fun awaitIdle() = Espresso.onIdle()
}

interface ExternalAction {
    fun perform(params: String, messageId: Long)
}

class ReadyAction(private val wsClientMock: WebSocketClient, private val testHelper: TestHelper) : ExternalAction {
    override fun perform(params: String, messageId: Long) {
        testHelper.awaitIdle()
        wsClientMock.sendAction("ready", Collections.emptyMap<Any, Any>(), messageId)
    }
}
