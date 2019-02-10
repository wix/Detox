package com.wix.detox

import com.facebook.react.bridge.ReactContext
import com.nhaarman.mockito_kotlin.*
import com.wix.detox.UTHelpers.yieldToOtherThreads
import org.junit.Before
import org.junit.Test
import java.util.*
import java.util.concurrent.Executors

open class ExternalActionTestsBase {
    val params = ""
    val messageId = 666L

    lateinit var rnContext: ReactContext
    lateinit var wsClientMock: WebSocketClient
    lateinit var actionsFacade: ActionsFacade

    @Before open fun setUp() {
        rnContext = mock()
        wsClientMock = mock()

        actionsFacade = mock()
        whenever(actionsFacade.awaitIdle()).then {
            synchronized(this) {}
        }
        whenever(actionsFacade.syncIdle()).then {
            synchronized(this) {}
        }
    }

}

class ReadyActionTest : ExternalActionTestsBase() {
    @Test fun `should reply with a 'ready' ACK if ready`() {
        uut().perform(params, messageId)
        verify(wsClientMock).sendAction(eq("ready"), eq(Collections.emptyMap<Any, Any>()), eq(messageId))
    }

    @Test fun `should block waiting for idle before ACK-ing`() {
        val executor = Executors.newSingleThreadExecutor()

        synchronized(this) {
            executor.submit {
                uut().perform(params, messageId)
            }
            yieldToOtherThreads(executor)
            verify(actionsFacade).awaitIdle()
            verify(wsClientMock, never()).sendAction(any(), any(), any())
        }
        yieldToOtherThreads(executor)
        verify(wsClientMock, times(1)).sendAction(any(), any(), any())
    }

    private fun uut() = ReadyAction(wsClientMock, actionsFacade)
}

class ReactNativeReloadActionTest : ExternalActionTestsBase() {
    @Test fun `should reload the app`() {
        uut().perform(params, messageId)
        verify(actionsFacade).reloadReactNative(rnContext)
    }

    @Test fun `should reply with a 'ready' ACK when ready`() {
        uut().perform(params, messageId)
        verify(wsClientMock).sendAction(eq("ready"), eq(Collections.emptyMap<Any, Any>()), eq(messageId))
    }

    @Test fun `should sync before ACK-ing`() {
        val executor = Executors.newSingleThreadExecutor()

        synchronized(this) {
            executor.submit {
                uut().perform(params, messageId)
            }
            yieldToOtherThreads(executor)
            verify(actionsFacade).syncIdle()
            verify(actionsFacade, never()).reloadReactNative(any())
            verify(wsClientMock, never()).sendAction(any(), any(), any())
        }
        yieldToOtherThreads(executor)
        verify(actionsFacade, times(1)).reloadReactNative(any())
        verify(wsClientMock, times(1)).sendAction(any(), any(), any())
    }

    private fun uut() = ReactNativeReloadAction(rnContext, wsClientMock, actionsFacade)
}
